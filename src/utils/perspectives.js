export const PERSPECTIVE_IDS = {
  OBJECTIVE: 'objective-description',
  URBAN: 'urban-planning',
  SOCIAL: 'social-dynamics',
  SAFETY: 'safety-assessment',
  ACCESSIBILITY: 'accessibility-review',
  FICTION: 'creative-fiction',
};

export const perspectiveList = [
  {
    id: PERSPECTIVE_IDS.OBJECTIVE,
    label: 'Objective Description',
    prompts: {
      isolated:
        'Describe what you see in this video frame. Be objective and factual.',
      continuous: {
        initial: 'Describe this initial video frame objectively. Focus on people, objects, activities, and setting. State only what is clearly visible without guessing unseen causes or motives.',
        subsequent:
          'Given the previous context:\n{{context}}\nDescribe only the observable changes in this frame. Focus on new positions, movements, or visible elements and avoid inventing people, objects, or actions that are not clearly present.',
      },
    },
    summaryInstruction:
      'Produce a cohesive, factual narrative that summarizes the entire video. Focus on key events, transitions, and outcomes while avoiding repetition.',
  },
  {
    id: PERSPECTIVE_IDS.URBAN,
    label: 'Urban Planning Analysis',
    prompts: {
      isolated:
        'Analyze this from an urban planning perspective: traffic flow, pedestrian infrastructure, accessibility features, public space design, and urban functionality.',
      continuous: {
        initial: 'Analyze this initial frame from an urban planning perspective, noting infrastructure, circulation, and spatial function. Base remarks strictly on clearly visible features.',
        subsequent:
          'Continuing the urban analysis from previous observations:\n{{context}}\nExplain only the visible changes in infrastructure or usage. Highlight new or shifting elements without speculating about unseen causes or actors.',
      },
    },
    summaryInstruction:
      'Summarize the video from an urban planning perspective, highlighting infrastructure performance, circulation patterns, accessibility, and spatial functionality.',
  },
  {
    id: PERSPECTIVE_IDS.SOCIAL,
    label: 'Social Dynamics Analysis',
    prompts: {
      isolated:
        'Analyze this from a sociological perspective: social interactions, group behavior, community dynamics, cultural patterns, and interpersonal relationships.',
      continuous: {
        initial: 'Analyze the initial social dynamics in this frame, noting roles, interactions, and group structures. Describe only behaviours you can directly observe.',
        subsequent:
          'Building on the previous frame:\n{{context}}\nDescribe how observable interactions shift in THIS frame compared to the previous one. Focus on specific changes in behaviours and proximity without assuming motivations or inventing new participants.',
      },
    },
    summaryInstruction:
      'Describe the overarching social narrative of the video, noting changing interactions, power dynamics, group behaviors, and notable social moments.',
  },
  {
    id: PERSPECTIVE_IDS.SAFETY,
    label: 'Safety Assessment',
    prompts: {
      isolated:
        'Analyze this from a safety perspective: identify potential hazards, risk factors, safety compliance issues, and protective measures.',
      continuous: {
        initial: 'Identify initial safety considerations in this frame, including hazards, protective measures, and risk levels. Mention only conditions you can clearly see.',
        subsequent:
          'Given earlier safety observations:\n{{context}}\nNote any clearly visible new hazards, mitigations, or risk changes. Do not infer events that are off-screen.',
      },
    },
    summaryInstruction:
      'Provide a comprehensive safety assessment of the video, capturing key risks, mitigations, compliance issues, and recommendations.',
  },
  {
    id: PERSPECTIVE_IDS.ACCESSIBILITY,
    label: 'Accessibility Review',
    prompts: {
      isolated:
        'Analyze this from an accessibility perspective: identify barriers, evaluate inclusive design features, assess mobility challenges, and note universal design elements.',
      continuous: {
        initial: 'Assess initial accessibility features and barriers in this frame, noting inclusive design elements and obstacles that are visibly present.',
        subsequent:
          'Continuing from previous accessibility observations:\n{{context}}\nIdentify any visible changes in accessibility, new barriers, or adjustments. Avoid speculating about features outside the frame.',
      },
    },
    summaryInstruction:
      'Summarize accessibility conditions across the video, covering barriers, inclusive design features, and opportunities for improvement.',
  },
  {
    id: PERSPECTIVE_IDS.FICTION,
    label: 'Creative Fiction (First-Person Story)',
    prompts: {
      isolated:
        'Pick one person visible in this frame and create a brief, respectful first-person narrative from their perspective. What might they be thinking or experiencing? Label clearly as creative fiction.',
      continuous: {
        initial:
          'Begin a first-person narrative from someone in this frame. Establish who they are, where they are, and what they notice based solely on visible details. Label the response as creative fiction.',
        subsequent:
          'Continue the story from the perspective established earlier:\n{{context}}\nAdvance the narrative using only what can be observed in this frame. Reflect on emotions that align with visible cues and avoid introducing new unseen events. Label the response as creative fiction.',
      },
    },
    summaryInstruction:
      'Write a cohesive first-person story that spans the whole video, weaving together the key moments into a continuous narrative. Keep it respectful, brief, and clearly labelled as creative fiction.',
  },
];

export function getPerspectiveById(id) {
  return perspectiveList.find((perspective) => perspective.id === id) ?? perspectiveList[0];
}

export function buildFramePrompt({ perspectiveId, mode, context }) {
  const perspective = getPerspectiveById(perspectiveId);
  if (mode === 'continuous') {
    if (!context || context.index === 0) {
      return perspective.prompts.continuous.initial;
    }
    const template = perspective.prompts.continuous.subsequent;
    // Only use the immediately preceding frame (not last 2)
    const mergedContext = (context.previousDescriptions ?? [])
      .slice(-1)
      .filter(Boolean)
      .join('\n');
    return template.replace('{{context}}', mergedContext || 'No prior context available.');
  }
  return perspective.prompts.isolated;
}

export function buildSummaryPrompt({ perspectiveId }) {
  const perspective = getPerspectiveById(perspectiveId);
  return perspective.summaryInstruction;
}
