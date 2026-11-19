# Agentic Workflow Protocol (AWP)

**An open, versioned contract for agentic workflows: what agents do, what they may do, and what
they leave behind.**

> MCP connects agents to tools. A2A connects agents to agents. AWP defines how agents work.

[Website](https://agenticworkflowprotocol.org) ·
[Specification](https://agenticworkflowprotocol.org/specification/v1alpha1/) ·
[Validator](https://validator.agenticworkflowprotocol.org) ·
[Editor](https://editor.agenticworkflowprotocol.org) ·
[Viewer](https://editor.agenticworkflowprotocol.org/viewer) ·
[Discussions](https://github.com/agenticworkflowprotocol/agenticworkflowprotocol.org/discussions)

## Why AWP exists

Agents no longer only answer questions. They open pull requests, change tickets, send messages and
deploy software. Whoever runs them has to answer the same questions every time:

- Which agents take part, with which models and which tools?
- In which order do the steps run, and what does each step hand on?
- Which actions are allowed, which need a human approval, and who approves?
- How much may a run cost, how long may it take, which data may it touch?
- What exactly happened in a run, and can it be reproduced?

In most systems the answers are spread over prompts, configuration files, code and the settings of
a platform. Nobody can review them in one place, compare two versions, or move a workflow to
another runtime without rewriting it.

HTTP APIs had the same problem until OpenAPI turned them into a document that people can review
and tools can read. Validators, viewers, code generators, mock servers and contract tests followed
from that one decision. AWP takes the same approach for agentic workflows.

## The idea

A workflow is a **manifest**: one YAML (or JSON) document that declares agents, tools, steps,
triggers, inputs, budgets, permissions, approvals and the audit trail.

- **Declarative.** The manifest says what may happen; the runtime enforces it before every model
  call and every action, and denies by default.
- **Versioned.** Every manifest has a name, a semantic version and a digest over its canonical
  form. A change is a new version that can be reviewed as a diff, approved and rolled back.
- **Schema first.** A JSON Schema defines the structure, the specification the semantics. Tools can
  rely on both, so a manifest is checked in the editor, in CI and in the runtime with the same rules.
- **Fail closed.** Unknown fields and fields of profiles a runtime does not support are rejected
  instead of ignored. A governance rule that is silently dropped is worse than an error.
- **Extensible.** Implementations add `x-` fields for what the core does not cover; useful
  extensions become core fields through AWP Enhancement Proposals.
- **Vendor-neutral.** AWP is a specification, not a platform. Any runtime may implement it.

Secure tooling needs exactly this: a contract that is readable by people and machines, so that
approvals, budgets and tool grants are reviewed before an agent runs, not discovered afterwards.

```yaml
apiVersion: awp.agenticworkflowprotocol.org/v1alpha1
kind: Workflow
metadata:
  name: ticket-triage
  version: 1.0.0
  owner:
    team: support-team
  classification: internal
spec:
  inputs:
    - name: ticket
      type: string
      required: true
  budget:
    maxCostUsd: 1.00
    maxSteps: 10
  mcpServers:
    - name: tickets
      transport: streamable-http
      url: https://tickets.example.com/mcp
  agents:
    - id: triager
      model:
        provider: example-provider
        name: example-model
      tools:
        - type: mcp
          server: tickets
          tools: [get_ticket, add_comment]
  workflow:
    - id: triage
      agent: triager
      task: "Read ticket ${{ inputs.ticket }} and propose a priority with a short reason."
  permissions:
    default: deny
    tools:
      tickets.get_ticket:
        allow: true
      tickets.add_comment:
        allow: true
  approval:
    requiredFor: [tickets.add_comment]
    approvers:
      - role: support-lead
    timeout: 4h
```

[Open this manifest in the editor](https://editor.agenticworkflowprotocol.org/#m=dVPBbtswDL37K4Rix9lJgJ18HbAPWNHtUBQFazGxEEnURDluUPTfR9lS0rWdT-Yz-cj3SEMwvzCyId8rmEMHB_TJDDPF497SHCIlGsh2FA-b0w5sGGHXHI3XvfpdchqHCTQk6BulPDjslTAcMbUpGuET9FRb7LpttxWAZo8x5yuVEFyveAqBopRIJPBggdnszQBpqTM-YfRgGw445Drjw5R4ZWj_6bpAQnsOArGM4A8FivhnMhFl9BSnPNbTpA-YVhIHz9-J0x3rZcptBW8TBhYoA24ItxizmM8ac-0cwXMWs7QXPfBksR1TCiVhirZXOeZ-sym1HT6DCxa7gdxG-kjqsopLJ7OMnf2MhcaRRtuXQClZ1clocVUVqrYil5R12vp5qa8zE1m-crXFvnWQ-vCi_b3ca7m6Fzcf169fFWj9KGKciHiQ1HpRH_UUnkXue40J-Nirm58IurRVX15eyva7gry-KvA6GxCIUYG8GYomndVs0igxj7INWT8w-e5GqANGZzifZBGtcQ-TlfYa_bn54Ehd0lXf1SuwWVU9qbfZbxz4XzqEvCQoa6wH-oPE5ftPaB6WtLXocoXZzUgWrz-RFbtWEcYhTSLr29j8BQ) to see it as a step
graph with its permissions and approvals.

## Projects

| Repository | What it is |
| --- | --- |
| [agenticworkflowprotocol.org](https://github.com/agenticworkflowprotocol/agenticworkflowprotocol.org) | The specification, JSON Schema, conformance suite, enhancement proposals and the website |
| [awp-validator](https://github.com/agenticworkflowprotocol/awp-validator) | Reference validator: `awp validate` CLI, Node.js and browser library, [online validator](https://validator.agenticworkflowprotocol.org) |
| [awp-editor](https://github.com/agenticworkflowprotocol/awp-editor) | Viewer and editor as Web Components (`<awp-viewer>`, `<awp-editor>`), embeddable like Swagger UI; [online editor](https://editor.agenticworkflowprotocol.org) |

## Implement AWP

1. Read the [specification](https://agenticworkflowprotocol.org/specification/v1alpha1/) and the
   [guide for runtime builders](https://agenticworkflowprotocol.org/implementations/build-your-own-runtime/).
2. Validate manifests with `@agenticworkflowprotocol/validator`, passing exactly the conformance
   profiles your runtime supports (`core`, `governance`, `audit`, `security`, `mcp`, `a2a`).
3. Run the [conformance suite](https://github.com/agenticworkflowprotocol/agenticworkflowprotocol.org/tree/main/conformance)
   in your CI against your validator and the manifests you export.
4. Enforce budgets, permissions and approvals in your control plane, before every model call and
   every action.
5. Document your extension fields and list your prefix in the
   [extension prefix list](https://github.com/agenticworkflowprotocol/agenticworkflowprotocol.org/blob/main/docs/registry/extension-prefixes.md).
6. Publish a conformance statement and open a pull request to be listed as an implementation.

Show manifests to your users with `<awp-viewer>` and let them edit with `<awp-editor>`; both come
from `@agenticworkflowprotocol/editor`.

## Contribute

- **Questions and ideas:** [GitHub Discussions](https://github.com/agenticworkflowprotocol/agenticworkflowprotocol.org/discussions).
- **Bugs and small changes:** issues and pull requests in the repository concerned.
- **Changes to the specification:** an [AWP Enhancement Proposal](https://github.com/agenticworkflowprotocol/agenticworkflowprotocol.org/blob/main/docs/aep-process.md).
  Experience from a real runtime is the best motivation for a proposal.
- **Reviews:** every proposal needs reviewers who are not its authors – runtime implementers,
  security, privacy, MCP and schema reviewers. Offer to review in Discussions.
- **How decisions are made:** [governance](https://github.com/agenticworkflowprotocol/agenticworkflowprotocol.org/blob/main/GOVERNANCE.md).
  Commits are signed off under the DCO; see [contributing](https://github.com/agenticworkflowprotocol/agenticworkflowprotocol.org/blob/main/CONTRIBUTING.md).

## Status

AWP is a draft. The current API version is `v1alpha1`; fields and semantics may change before
`v1beta1`. No implementation claims conformance yet.

AWP provides machine-readable governance primitives that can help organizations implement and
enforce their own compliance requirements. Compliance depends on the implementation,
organizational controls and applicable regulatory requirements.

Contact: info@agenticworkflowprotocol.org · Security reports: private vulnerability reporting in
the repository concerned.
