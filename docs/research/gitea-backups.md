# Backing up and restoring Gitea

Research for [#130](https://github.com/UnstoppableMango/vcs/issues/130), feeding the decision in [#131](https://github.com/UnstoppableMango/vcs/issues/131).
Gathered 2026-11-06.

## What is being backed up

From `apps/gitea` in UnstoppableMango/the-cluster (at `b15baf4`):

| State | Where | Notes |
| --- | --- | --- |
| Database | CNPG `Cluster` `gitea/postgres`, 1 instance, 5Gi `fast-rwo` | No `backup` section, no `plugins`. Gitea connects as `gitea` with a client certificate (`pg_hba: hostssl gitea gitea all cert`) to `postgres-rw.gitea.svc.cluster.local`, which is a SAN on `postgres-server-cert` (`certificate.yml`). |
| Repositories, `data/` (avatars, attachments, indexes, LFS if enabled), `custom/` | Chart PVC, 20Gi `standard-rwo` | Both storage classes are Ceph RBD (`rook-ceph.rbd.csi.ceph.com`), pools `standard` and `default-ssd` (`infrastructure/configs/rook-ceph/storage/`). |
| Cache, sessions, queues | `charts/redis` Deployment | No volume: already lost on every Redis restart, so not worth backing up. Pending queue items (webhooks, indexing) are the only thing at stake. |
| Config | Git (`helm-release.yml`), sealed secrets | Already reproducible from the-cluster. |

Operator versions: CloudNativePG 1.30.1 (chart 0.29.1, `infrastructure/controllers/cnpg-system/helm-release.yml`), Velero 1.18.4 (chart 12.2.3).

## What the-cluster already has

**Velero** (`infrastructure/controllers/velero-system`, `infrastructure/configs/velero-system`) is the only backup tooling deployed.

- Two `BackupStorageLocation`s: `backblaze` (B2 bucket `thecluster-velero`, `us-west-002`) and `thecluster` (in-cluster Ceph RGW bucket `velero`, from an `ObjectBucketClaim`; the default).
- Four `Schedule`s, all `snapshotVolumes: true`, `snapshotMoveData: true`, `datamover: velero`: `backblaze-daily` (00:00, 7d TTL), `thecluster-daily` (01:00, 7d), `backblaze-weekly` (Sun 02:00, 28d), `thecluster-weekly` (Sun 03:00, 28d).
- Opt-in is by label on the resource: `backup.thecluster.io/schedule: daily|weekly` plus `backup.thecluster.io/backblaze: 'true'` and/or `backup.thecluster.io/thecluster: 'true'`.
- CSI snapshots work because `external-snapshotter` v8.7.0 is installed and the `ceph-rbd` `VolumeSnapshotClass` carries `velero.io/csi-volumesnapshot-class: "true"` (`infrastructure/configs/rook-ceph/snapshots/volume-snapshot-class.yml`).
- The node agent runs only on `zeus` and `gaea`, with `nodeAgent.disableHostPath: true`. That host path is what Velero's file-system backup (pod-volume restic/kopia) reads from, so in this setup Velero backs volumes up only through CSI snapshot data movement.
- Users today: `apps/nextcloud` (both PVCs, and the CNPG instance volumes via `inheritedMetadata.labels`), `apps/seedvault`, `apps/migrate`.

**No CNPG cluster backs up to object storage.** No barman-cloud plugin is installed, and no `Cluster` in the-cluster has a `backup` section. `apps/nextcloud/postgres-cluster.yml` and `apps/nextcloud/README.md` describe its Velero snapshot of the Postgres volumes as "a crash-consistent snapshot ... a stopgap until the cluster backs up to object storage through the Barman Cloud plugin".

The Nextcloud README is the in-repo precedent for the consistency question below: "The file and database backups are not taken at the same instant", and it rescans after a restore.

The B2 bucket `thecluster-velero` is not managed by UnstoppableMango/control-plane. That repo manages only `unstoppablemango-pulumi-state`, plus per-consumer `b2:ApplicationKey`s scoped by `bucketIds` (`Pulumi.yaml`).

## Database options

### A. Barman Cloud plugin (CNPG-I), to B2

The supported path. CNPG docs: "Starting with version 1.26, native backup and recovery capabilities are being progressively phased out of the core operator and moved to official CNPG-I plugins" ([backup.md @ v1.30.1](https://github.com/cloudnative-pg/cloudnative-pg/blob/v1.30.1/docs/src/backup.md)).

- **Install:** needs CNPG ≥ 1.26 and cert-manager (both present). It is installed in the operator's namespace (`cnpg-system`) from a manifest or Helm chart; latest is v0.15.1 ([installation](https://cloudnative-pg.io/plugin-barman-cloud/docs/installation/)). One new controller in `infrastructure/controllers`.
- **Shape:** an `ObjectStore` (`barmancloud.cnpg.io/v1`) with `destinationPath`, `endpointURL`, `s3Credentials`, and `retentionPolicy` (e.g. `"30d"`, a recovery window). The `Cluster` adds `plugins: [{name: barman-cloud.cloudnative-pg.io, isWALArchiver: true, parameters: {barmanObjectName: ...}}]`. Base backups come from a `ScheduledBackup` with `method: plugin` ([usage](https://github.com/cloudnative-pg/plugin-barman-cloud/blob/main/web/docs/usage.md), [retention](https://github.com/cloudnative-pg/plugin-barman-cloud/blob/main/web/docs/retention.md)).
- **B2:** treated as a generic S3-compatible endpoint (`endpointURL: https://s3.us-west-002.backblazeb2.com`, the same endpoint Velero uses). The docs warn that third-party S3 incompatibilities are the vendor's problem. They also document a boto3 `x-amz-content-sha256` failure, fixed by setting `AWS_REQUEST_CHECKSUM_CALCULATION`/`AWS_RESPONSE_CHECKSUM_VALIDATION=when_required` through `instanceSidecarConfiguration.env` ([object_stores](https://github.com/cloudnative-pg/plugin-barman-cloud/blob/main/web/docs/object_stores.md)). Expect to need that workaround on B2; it has not been tested here.
- **What you get:** hot backups with no downtime, continuous WAL archiving, and point-in-time recovery to any moment inside the retention window. CNPG sets `archive_timeout` to 5 min, so RPO is at most about 5 minutes ([wal_archiving.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/v1.30.1/docs/src/wal_archiving.md)). The object store is off-site, independent of Ceph.
- **Restore:** never in place. Recovery "is used to bootstrap a new cluster" ([recovery.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/v1.30.1/docs/src/recovery.md)). The new `Cluster` uses `bootstrap.recovery.source` → an `externalClusters` entry with `plugin.parameters.barmanObjectName` and `serverName: <old cluster name>`, plus optional `recoveryTarget.targetTime`/`targetLSN`/`targetImmediate`/`backupID`. The restored cluster does not archive unless `plugins` is added again. It must archive to a different `ObjectStore` or `serverName`; otherwise the "Expected empty archive" check holds it in `Setting up primary`.
- **Restore wrinkle specific to this deployment:** the service name follows the cluster name (`<name>-rw`). Gitea's `HOST` and the SANs in `certificate.yml` are both `postgres-rw...`. Restoring under a new name therefore also means editing the HelmRelease and reissuing the server certificate. The alternative is to delete the broken `postgres` Cluster and recreate `postgres` from the backup, archiving under a new `serverName`. Roles and `pg_hba` come back from the data and the spec, so certificate auth for `gitea` survives either way.
- **Cost:** one plugin controller, plus a sidecar on each instance pod. B2 storage is full base backups (tarballs, no incremental copy per the CNPG comparison table) times retention, plus the WAL. On a 5Gi volume that is single-digit GB a month even at 30d retention with weekly base backups. B2 bills $6.95/TB/month, first 10GB free, with Class A/B/C calls free and no minimum storage duration ([pricing](https://www.backblaze.com/cloud-storage/pricing)), so on the order of cents a month. The real cost is one new controller and one B2 bucket/key to provision.

### B. In-tree `spec.backup.barmanObjectStore`

The same Barman Cloud tooling configured directly on the `Cluster` ([appendix B](https://github.com/cloudnative-pg/cloudnative-pg/blob/v1.30.1/docs/src/appendixes/backup_barmanobjectstore.md)). It has the same features (WAL archive, PITR, retention) and needs no plugin install. It is deprecated since 1.26, and the docs "strongly recommend beginning a gradual migration to the plugin". Choosing it now means a planned migration later ([migration guide](https://cloudnative-pg.io/plugin-barman-cloud/docs/migration/)). Its only advantage is skipping one controller.

### C. CNPG volume-snapshot backups (`method: volumeSnapshot`)

CSI snapshots of the instance PVC through `spec.backup.volumeSnapshot.className: ceph-rbd` ([appendix A](https://github.com/cloudnative-pg/cloudnative-pg/blob/v1.30.1/docs/src/appendixes/backup_volumesnapshot.md)). CNPG brackets the snapshot with `pg_backup_start`/`stop`, so unlike a bare Velero snapshot it is consistent. Cold mode (`online: false`) fences the primary, and with one instance that means downtime. Incremental copies are cheap on RBD. But there is no retention policy, and PITR "requires WAL archive", which in practice means option A anyway. The snapshots also live in the same Ceph cluster, so they do not protect against losing Ceph.

### D. Velero snapshot of the CNPG PVC (what Nextcloud does)

Add `inheritedMetadata.labels` with the `backup.thecluster.io/*` labels to the `Cluster`. This reuses existing schedules and the off-site B2 copy, with zero new components. The result is only crash-consistent (Postgres recovers it like a power cut), with no PITR, and its RPO is the schedule (24h). Restore means a Velero restore of the namespace or PVC, and CNPG must adopt the restored PVC. That restore path is untested here, and Nextcloud calls it a stopgap.

### E. Logical `pg_dump` CronJob

Not built into CNPG. A CronJob would connect with a client cert (or the break-glass password over non-SSL, per the `pg_hba` comment) and upload to S3. Portable and small, but it has no PITR, and the Job and upload tooling would be something new to maintain. `gitea dump` (below) already produces the same thing for this database.

## Repository-data options

### F. `gitea dump`

From `cmd/dump.go` at v28.3.0, the zip (or `--type` tar variants, `--file -` for stdout) contains:

- `repos/`, unless `--skip-repository`
- `data/` (`APP_DATA_PATH`) minus repo, LFS, attachment, package, repo-archive and log paths. Those are added back separately, except **repo archives, which are never included**, and file sessions are excluded.
- LFS, attachments and packages, each with a `--skip-*` flag
- the bleve indexes, unless `--skip-index`
- `custom/` and `app.ini`
- `gitea-db.sql`, a SQL dump through Gitea's own DB connection (`--database postgres`), unless `--skip-db`
- `log/`

The [backup docs](https://docs.gitea.com/administration/backup-and-restore) (version 28):

- Consistency: "To ensure the consistency of the Gitea instance, it must be shutdown during backup." A running dump can capture a migration where "the git repository may be incomplete although the database claims otherwise."
- Database: admins "may prefer to use the native the MySQL and PostgreSQL dump tools instead."
- Restore: "There is currently no support for a recovery command." It is manual: unpack files into place, `psql -d $DATABASE < gitea-db.sql`, restart, then `gitea admin regenerate hooks` (needed when the install method changed) and `gitea doctor check` (`--fix`).

In this deployment the dump has to run inside the Gitea pod (`kubectl exec`, as `git`), since it needs the PVC and the DB client certificate env. It writes a full, non-incremental copy, staged in `--tempdir` (by default on the container's filesystem) unless streamed with `--file -`. Shipping it off-cluster needs a CronJob or another place to put it. Neither exists here: Velero cannot back up a file that is not on a PVC. The upside is that it is a single, portable, Gitea-version-tagged artifact that also restores onto a non-Kubernetes or SQLite install. The cost is the custom plumbing, plus either downtime (`replicaCount: 0`, which breaks `kubectl exec`) or accepting the documented race.

### G. Ceph RBD `VolumeSnapshot` alone

The `ceph-rbd` `VolumeSnapshotClass` already exists, so a `VolumeSnapshot` of the Gitea PVC is one manifest, or a small CronJob for scheduling, which nothing provides natively. Snapshots are instant, copy-on-write and crash-consistent. Restore means creating a PVC with `dataSource` → the snapshot. They live in the same Ceph pools, though, so they are a fast undo for a bad upgrade but not a backup against losing Ceph. Useful as a pre-upgrade step ([#136](https://github.com/UnstoppableMango/vcs/issues/136)).

### H. Velero CSI snapshot + data mover (reuse existing schedules)

Label the PVC `backup.thecluster.io/schedule: daily` plus `backblaze`/`thecluster: 'true'`. Velero takes an RBD snapshot and a data-mover pod uploads it with Kopia to B2 and/or Ceph RGW. Uploads are incremental and deduplicated ([CSI snapshot data movement](https://velero.io/docs/v1.18/csi-snapshot-data-movement/)). On restore, Velero recreates the PVC "with the same specification of the source volume" and pulls the data back. It needs no new components and covers the whole PVC (`data/`, `custom/`, repos, indexes, everything).

- Crash-consistent only. Git's on-disk format tolerates this well: objects are immutable and refs are updated by atomic rename. Gitea's other files (indexes) are rebuildable.
- Velero pre/post backup hooks (`pre.hook.backup.velero.io/command` etc. on the pod) could run `fsfreeze` or a quiesce ([backup hooks](https://velero.io/docs/v1.18/backup-hooks/)). They run only for pods that are part of the backup, which with these label selectors means labelling the pod too.
- Labelling: whether chart 12.7.0 exposes `persistence.labels` was not verified (the chart's values were unreachable from this session). If it does not, the fallback is the Nextcloud pattern: a self-managed labelled PVC in the app directory, referenced via `persistence.create: false` + `persistence.claimName`.
- Cost: only B2 storage for a ≤20Gi volume that Kopia stores incrementally, about $0.15/month at full size. Restores are well inside the 3x free egress.

### I. restic / VolSync / Velero file-system backup

None are deployed. Velero's file-system backup is ruled out by `disableHostPath: true` unless that is changed on the shared node agent. VolSync or a restic CronJob would add a new operator or tool for a capability H already provides. The only reason to pick one is file-level restore of a single repo without restoring the whole PVC. H can approximate that by restoring to a scratch namespace and copying out.

## Restoring a DB and repo backup taken at different times

Gitea's docs say only that consistency requires stopping Gitea during the backup. They give no guidance for independently-timed backups. What goes wrong is predictable from what the DB holds about repos:

- **Repo dir newer than DB:** pushes after the DB backup are in git but not in Gitea's branch, tag and release tables, or in PR state, push actions and commit-status rows. Repos created after the DB backup appear as orphan directories.
- **DB newer than repo dir:** rows for repos, branches or commits whose objects are missing. Created repos have no directory.

Gitea ships repair tools for exactly these cases (v28.3.0 source):

- Cron/admin tasks `reinit_missing_repos`, `delete_missing_repos`, `resync_all_hooks`, `resync_all_sshkeys` (`services/cron/tasks_extended.go`)
- `gitea admin repo-sync-releases` (tags → release rows) and `gitea admin regenerate hooks|keys` (`cmd/admin.go`)
- `gitea doctor check` with `check-db-consistency`, `delete-orphaned-repos`, `hooks`, and the `storages`/`storage-*` orphan checks (`services/doctor/`)
- A later push to a branch resyncs that branch (`SyncBranchesToDB` in `services/repository/branch.go`)

Those tools repair structural mismatches. They do not recover PR, issue or comment activity lost in the gap. In practice:

- **Taking both from one source at one instant** avoids the problem: `gitea dump` with Gitea stopped, or one Velero backup that includes both PVCs. Velero snapshots each PVC in turn, though, not atomically together.
- **With PITR on the DB (option A)** the gap can be closed from the DB side: restore the repo PVC from snapshot time T, then `recoveryTarget.targetTime: T`. The DB lands at the same moment as the files, to within the snapshot duration, and the repair tools cover the remainder. This is the strongest argument for A + H together.
- **Without PITR,** expect a window of up to the schedule interval (24h for the existing schedules), plus the repair pass above, which matches what the Nextcloud README accepts for Nextcloud.

## Summary

| Option | Covers | Consistency | PITR | Off-site | New components | Ongoing cost |
| --- | --- | --- | --- | --- | --- | --- |
| A. Barman Cloud plugin | DB | Consistent (hot base + WAL) | Yes, RPO ≤ 5 min | B2 | Plugin controller, B2 bucket + key | Cents/month |
| B. In-tree `barmanObjectStore` | DB | Same as A | Yes | B2 | B2 bucket + key | Same; deprecated, migration owed |
| C. CNPG volumeSnapshot | DB | Consistent | Only with WAL archive (A) | No (Ceph) | None | Ceph space |
| D. Velero on CNPG PVC | DB | Crash-consistent | No, RPO 24h | B2 + RGW | None (labels) | Cents/month |
| E. pg_dump CronJob | DB | Consistent | No | Wherever uploaded | CronJob + uploader | Small |
| F. `gitea dump` | Everything | Only if Gitea stopped | No | Needs plumbing | CronJob/exec + upload | Full copy each run; downtime or race |
| G. RBD VolumeSnapshot | Repo PVC | Crash-consistent | No | No (Ceph) | None (or a CronJob) | Ceph space |
| H. Velero data mover | Repo PVC (any PVC) | Crash-consistent | No, RPO 24h | B2 + RGW | None (labels) | ~$0.15/month at 20Gi |
| I. restic/VolSync/Velero FSB | Repo PVC | Crash-consistent (live read) | No | Configurable | New operator, or node-agent change | Small |

Facts relevant to the decision in #131:

- Velero with CSI data mover to B2 and Ceph RGW, opted into by label, is already the cluster's backup system and covers the repo PVC with no new parts.
- CNPG's own docs, and the Nextcloud manifests, point to the Barman Cloud plugin as the long-term DB answer. No cluster in the-cluster uses it yet, so Gitea would be the first: plugin install, a B2 bucket and key, and the checksum workaround to verify.
- PITR on the DB is what makes the repo and DB backups line up at restore time. Without it, the gap is up to one schedule interval, followed by Gitea's repair tasks.
- `gitea dump` is the only option that produces a portable, self-contained artifact. Gitea's docs say it is consistent only with Gitea stopped, and it needs plumbing this cluster does not have.
- Ceph-local snapshots (C, G) are not off-site backups, but they are a cheap pre-upgrade rollback.

## Open points not verified here

- Whether gitea chart 12.7.0 has `persistence.labels` (values.yaml was not reachable from this session).
- B2 behaviour with barman-cloud's boto3 (whether the checksum env vars are needed).
- A CNPG cluster adopting a PVC that Velero restored (option D), which no app here has exercised.
