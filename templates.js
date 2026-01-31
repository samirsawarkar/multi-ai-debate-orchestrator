// Pre-built flow templates for multi-AI orchestration

const TEMPLATES = {
  brainstorm: {
    name: 'Brainstorm',
    description: 'Generate ideas, critique them, then synthesize improvements',
    ais: [
      {
        provider: 'chatgpt',
        role: 'Idea Generator',
        goal: 'Generate 5 diverse ideas',
        constraints: ['No evaluation', 'No filtering', 'Raw ideas only'],
        outputFormat: 'Numbered list'
      },
      {
        provider: 'claude',
        role: 'Devil\'s Advocate',
        goal: 'Attack assumptions and find flaws',
        constraints: ['No solutions', 'No politeness', 'Bullet points only'],
        outputFormat: 'Critical analysis'
      },
      {
        provider: 'gemini',
        role: 'Synthesizer',
        goal: 'Improve ideas based on criticism',
        constraints: ['Address flaws', 'Rank by survivability'],
        outputFormat: 'Ranked list with reasoning'
      }
    ],
    maxRounds: 1
  },

  debate: {
    name: 'Debate',
    description: 'Two AIs debate a topic, third judges the winner',
    ais: [
      {
        provider: 'chatgpt',
        role: 'Advocate',
        goal: 'Defend the position strongly',
        constraints: ['Use evidence', 'Address counterarguments', 'Stay on topic'],
        outputFormat: 'Structured argument'
      },
      {
        provider: 'claude',
        role: 'Opponent',
        goal: 'Attack the position with counterarguments',
        constraints: ['Find weaknesses', 'Provide alternatives', 'Be rigorous'],
        outputFormat: 'Point-by-point rebuttal'
      },
      {
        provider: 'gemini',
        role: 'Judge',
        goal: 'Evaluate both arguments objectively',
        constraints: ['Identify strongest points', 'Spot logical flaws', 'Declare winner'],
        outputFormat: 'Verdict with reasoning'
      }
    ],
    maxRounds: 2
  },

  validation: {
    name: 'Validation',
    description: 'Propose solution, test edge cases, assess feasibility',
    ais: [
      {
        provider: 'chatgpt',
        role: 'Solution Designer',
        goal: 'Design a complete solution to the problem',
        constraints: ['Be specific', 'Include implementation details', 'Consider tradeoffs'],
        outputFormat: 'Detailed solution'
      },
      {
        provider: 'claude',
        role: 'Edge Case Analyst',
        goal: 'Find edge cases and failure scenarios',
        constraints: ['Think adversarially', 'Test boundaries', 'No mercy'],
        outputFormat: 'List of edge cases with severity'
      },
      {
        provider: 'gemini',
        role: 'Feasibility Assessor',
        goal: 'Evaluate if solution handles edge cases',
        constraints: ['Rate feasibility 1-10', 'Identify gaps', 'Suggest modifications'],
        outputFormat: 'Assessment with score'
      }
    ],
    maxRounds: 1
  },

  redteam: {
    name: 'Red Team',
    description: 'Security analysis through adversarial thinking',
    ais: [
      {
        provider: 'chatgpt',
        role: 'System Architect',
        goal: 'Describe the system architecture and security measures',
        constraints: ['Be thorough', 'Document assumptions', 'Explain defenses'],
        outputFormat: 'Architecture description'
      },
      {
        provider: 'claude',
        role: 'Attacker',
        goal: 'Find vulnerabilities and attack vectors',
        constraints: ['Think like a hacker', 'Exploit weaknesses', 'Chain attacks'],
        outputFormat: 'Attack scenarios'
      },
      {
        provider: 'gemini',
        role: 'Security Auditor',
        goal: 'Prioritize vulnerabilities and recommend fixes',
        constraints: ['Risk assessment', 'Practical remediation', 'Cost-benefit analysis'],
        outputFormat: 'Security report'
      }
    ],
    maxRounds: 1
  }
};

// Helper to build prompts with role context
function buildPrompt(aiConfig, previousContext, userInput) {
  let prompt = `ROLE: ${aiConfig.role}\n`;
  prompt += `GOAL: ${aiConfig.goal}\n`;
  prompt += `CONSTRAINTS:\n${aiConfig.constraints.map(c => `- ${c}`).join('\n')}\n`;
  prompt += `OUTPUT FORMAT: ${aiConfig.outputFormat}\n\n`;
  
  if (userInput) {
    prompt += `PROBLEM/TOPIC:\n${userInput}\n\n`;
  }
  
  if (previousContext && previousContext.length > 0) {
    prompt += `PREVIOUS RESPONSES:\n`;
    previousContext.forEach((ctx, idx) => {
      prompt += `\n[${ctx.role}]:\n${ctx.output}\n`;
    });
    prompt += `\n`;
  }
  
  prompt += `Your response:`;
  return prompt;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TEMPLATES, buildPrompt };
}
