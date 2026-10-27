import * as gh from "@pulumi/github";
import type {
	RepositoryRulesetRules,
	RepositoryRulesetRulesRequiredStatusChecksRequiredCheck,
} from "@pulumi/github/types/input";
import type { CustomResourceOptions, Input } from "@pulumi/pulumi";

export interface MainRulesetArgs {
	// requiredChecks has no default, unlike PublicRepo's: a repository
	// declared bare has no `required` gate job to fall back on, and a check
	// that never reports blocks every merge. An empty list requires none.
	requiredChecks: RepositoryRulesetRulesRequiredStatusChecksRequiredCheck[];

	// rules are merged over the standard rules, as PublicRepo's are. A key
	// given here replaces that rule outright.
	rules?: Partial<RepositoryRulesetRules>;
}

// addMainRuleset gives a public repository that is not a PublicRepo the main
// ruleset PublicRepo creates, so every public repository has one. Keep these
// rules in step with pulumi-components' PublicRepo.
export function addMainRuleset(
	name: string,
	repository: Input<string>,
	args: MainRulesetArgs,
	opts?: CustomResourceOptions,
): gh.RepositoryRuleset {
	return new gh.RepositoryRuleset(
		name,
		{
			name: "main",
			repository,
			enforcement: "active",
			target: "branch",
			conditions: {
				refName: {
					includes: ["~DEFAULT_BRANCH"],
					excludes: [],
				},
			},
			rules: {
				deletion: true,
				pullRequest: {
					dismissStaleReviewsOnPush: true,
					allowedMergeMethods: ["squash"],
				},
				nonFastForward: true,
				requiredLinearHistory: true,
				requiredStatusChecks:
					args.requiredChecks.length > 0
						? { requiredChecks: args.requiredChecks }
						: undefined,
				...args.rules,
			},
		},
		opts,
	);
}
