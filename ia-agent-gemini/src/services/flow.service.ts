import { FlowDefinition, FlowInfo, FlowInput } from "../types";

const FLOW_ORCHESTRATOR_BASE = process.env.FLOW_ORCHESTRATOR_URL || "http://localhost:3002";

export async function getAvailableFlows(): Promise<FlowInfo[]> {
  const response = await fetch(`${FLOW_ORCHESTRATOR_BASE}/flows`);
  if (!response.ok) {
    throw new Error(`Error fetching flows: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
}

export async function getFlowDetails(flowId: string): Promise<FlowDefinition> {
  const response = await fetch(`${FLOW_ORCHESTRATOR_BASE}/flows/${flowId}`);
  if (!response.ok) {
    throw new Error(`Error fetching flow details: ${response.statusText}`);
  }
  return await response.json();
}

export async function getFlowInputs(flowId: string): Promise<FlowInput[]> {
  const flowDetails = await getFlowDetails(flowId);
  return flowDetails.inputs;
}

export async function executeFlow(flowId: string, inputs: Record<string, any>): Promise<any> {
  const response = await fetch(`${FLOW_ORCHESTRATOR_BASE}/flows/${flowId}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(inputs),
  });
  
  if (!response.ok) {
    throw new Error(`Error executing flow: ${response.statusText}`);
  }
  
  return await response.json();
}

export async function validateInput(validationUrl: string, value: any): Promise<boolean> {
  try {
    const response = await fetch(validationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.valid;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}