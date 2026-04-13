# Visibility Ledger Design

## Purpose

This document defines the future visibility ledger that support and operations tooling should use to explain why a surface is visible, hidden, allowed, or denied.

This is a planning document only. It does not mean the current runtime already emits a full ledger.

## Shared Planning Contract

The future planning contract for visibility-ledger records lives in:

- [visibility-ledger.ts](/E:/Workspace/codexsun/apps/framework/shared/visibility-ledger.ts:1)

That contract defines:

1. target types
2. decision sources
3. individual ledger entries
4. the overall record shape for one tenant and workspace-profile evaluation

## Why The Ledger Exists

Future workspace resolution will be too layered to debug by guesswork alone.

The ledger should answer:

1. why is this workspace visible?
2. why is this page hidden?
3. why is this action disabled?
4. which layer denied export or publish?
5. which feature flag changed the result?

## Input Sources

The future ledger should record decisions from these sources:

1. `platform-default`
2. `mode`
3. `industry-pack`
4. `client-overlay`
5. `enabled-apps`
6. `workspace-profile`
7. `permission-matrix`
8. `feature-flag`

## Target Types

The ledger should support these target types:

1. `workspace`
2. `module`
3. `page`
4. `report`
5. `widget`
6. `action`
7. `feature-flag`

## Decision Types

The ledger should store one of four decisions:

1. `visible`
2. `hidden`
3. `allowed`
4. `denied`

Guideline:

1. `visible` and `hidden` are for shell composition
2. `allowed` and `denied` are for permission and action evaluation

## Resolution Flow

Future runtime resolution should produce the ledger in this order:

1. add baseline workspace entries from platform defaults
2. record mode-based inclusions or exclusions
3. record industry-pack additions and removals
4. record client-overlay additions, removals, and restrictions
5. record enabled-app filtering
6. record workspace-profile permission narrowing
7. record action-level permission decisions
8. record feature-flag final overrides

The final visible shell should always be explainable from the ledger, not by hidden branching.

## Support View Requirements

Future support tooling should expose:

1. the evaluated tenant, client overlay, industry pack, mode, and profile
2. the final visible workspace tree
3. the final effective action grants
4. the ledger entries that produced those results
5. human-readable reason text for each decisive entry

## Example Ledger Questions

### Why can Techmedia marketing not publish storefront changes?

Expected future ledger:

1. `ecommerce.storefront-designer` is `visible` from client-overlay and workspace-profile rules
2. `ecommerce.storefront-designer.publish` is `denied` by permission-matrix or feature-flag rule
3. support tooling should show the exact source and reason

### Why is education hidden for Horse Club?

Expected future ledger:

1. education workspace starts absent from the `single-brand-retail` industry pack
2. the client overlay does not re-enable it
3. final ledger shows `hidden` sourced from industry-pack or enabled-app filtering

## Operator UX Guideline

The future debug surface should stay operator-readable:

1. one subject context per evaluation
2. clear final result summary
3. expandable rule trail
4. machine-readable export later if needed

This should become the main support explanation tool instead of raw shell-condition inspection.
