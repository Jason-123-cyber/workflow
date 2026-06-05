import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getWorkflowQueueTrigger, STEP_QUEUE_TRIGGER } from './constants.js';

describe('getWorkflowQueueTrigger', () => {
  let originalStrict: string | undefined;

  beforeEach(() => {
    originalStrict = process.env.WORKFLOW_SEQUENTIAL_REPLAYS;
  });

  afterEach(() => {
    if (originalStrict !== undefined) {
      process.env.WORKFLOW_SEQUENTIAL_REPLAYS = originalStrict;
    } else {
      delete process.env.WORKFLOW_SEQUENTIAL_REPLAYS;
    }
  });

  it('omits maxConcurrency by default', () => {
    delete process.env.WORKFLOW_SEQUENTIAL_REPLAYS;
    const trigger = getWorkflowQueueTrigger();
    expect(trigger.topic).toBe('__wkf_workflow_*');
    expect('maxConcurrency' in trigger).toBe(false);
  });

  it('sets maxConcurrency: 1 when WORKFLOW_SEQUENTIAL_REPLAYS=1', () => {
    process.env.WORKFLOW_SEQUENTIAL_REPLAYS = '1';
    const trigger = getWorkflowQueueTrigger();
    expect(trigger).toMatchObject({
      topic: '__wkf_workflow_*',
      maxConcurrency: 1,
    });
  });

  it('does not set maxConcurrency for non-"1" values', () => {
    process.env.WORKFLOW_SEQUENTIAL_REPLAYS = 'true';
    const trigger = getWorkflowQueueTrigger();
    expect('maxConcurrency' in trigger).toBe(false);
  });

  it('never applies concurrency to the step trigger', () => {
    process.env.WORKFLOW_SEQUENTIAL_REPLAYS = '1';
    expect('maxConcurrency' in STEP_QUEUE_TRIGGER).toBe(false);
  });
});
