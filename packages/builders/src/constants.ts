import { QueueNamespaceSchema } from '@workflow/world';

function resolveQueueNamespace(namespace: string | undefined) {
  return namespace ?? process.env.WORKFLOW_QUEUE_NAMESPACE;
}

function getQueueTopicPrefix(
  kind: 'workflow' | 'step',
  namespace: string | undefined
) {
  if (namespace !== undefined) {
    QueueNamespaceSchema.parse(namespace);
    return `__${namespace}_wkf_${kind}_`;
  }

  return `__wkf_${kind}_`;
}

/**
 * Creates a queue trigger configuration for the workflow handler.
 * Handles both workflow orchestration and step execution on the same route.
 * Background steps are queued back to the workflow topic with a stepId.
 *
 * When `namespace` is provided, the trigger topic is scoped to avoid
 * collisions with other frameworks or direct Workflow SDK usage in the
 * same deployment.
 *
 * @example
 * // default: topic = '__wkf_workflow_*'
 * createWorkflowQueueTrigger(undefined)
 *
 * @example
 * // namespaced: topic = '__custom_wkf_workflow_*'
 * createWorkflowQueueTrigger('custom')
 */
export function createWorkflowQueueTrigger(namespace: string | undefined) {
  const resolvedNamespace = resolveQueueNamespace(namespace);

  return {
    type: 'queue/v2beta' as const,
    topic: `${getQueueTopicPrefix('workflow', resolvedNamespace)}*`,
    consumer: 'default',
    retryAfterSeconds: 5, // Delay between retries (default: 60)
    initialDelaySeconds: 0, // Initial delay before first delivery (default: 0)
  };
}

/**
 * Creates the optional second argument for generated `workflowEntrypoint()`
 * calls. The namespace is resolved while building so generated route files do
 * not need `WORKFLOW_QUEUE_NAMESPACE` at runtime.
 */
export function createWorkflowEntrypointOptionsCode(
  namespace: string | undefined
) {
  const resolvedNamespace = resolveQueueNamespace(namespace);

  if (!resolvedNamespace) {
    return '';
  }

  // Reuse prefix construction for namespace validation.
  getQueueTopicPrefix('workflow', resolvedNamespace);

  return `, { namespace: ${JSON.stringify(resolvedNamespace)} }`;
}

/**
 * Default queue trigger (no namespace). Backward compatible.
 */
export const WORKFLOW_QUEUE_TRIGGER = createWorkflowQueueTrigger(undefined);
