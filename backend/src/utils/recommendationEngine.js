function getRecommendations(userProfile, jobs, config = { skillWeight: 70, interestWeight: 30 }) {
  const { skills = [], interests = [], experienceLevel = "entry" } = userProfile;
  
  const skillWeight = config.skillWeight ?? 70;
  const interestWeight = config.interestWeight ?? 30;

  const userSkillsLower = skills.map((s) => s.trim().toLowerCase());
  const userInterestsLower = interests.map((i) => i.trim().toLowerCase());

  const levelValues = { entry: 1, mid: 2, senior: 3 };
  const userExpValue = levelValues[experienceLevel] || 1;

  return jobs.map((job) => {
    const jobSkills = job.requiredSkills || [];
    const jobCategory = (job.category || "").trim().toLowerCase();
    const jobExpValue = levelValues[job.experienceLevel] || 1;

    // 1. Skill Overlap Calculation
    let skillScore = 1.0;
    let matchedSkills = [];
    let missingSkills = [];

    if (jobSkills.length > 0) {
      matchedSkills = jobSkills.filter((s) => userSkillsLower.includes(s.trim().toLowerCase()));
      missingSkills = jobSkills.filter((s) => !userSkillsLower.includes(s.trim().toLowerCase()));
      skillScore = matchedSkills.length / jobSkills.length;
    }

    // 2. Interest Match Calculation
    const interestMatch = userInterestsLower.includes(jobCategory) ? 1.0 : 0.0;

    // 3. Weighted Score (0 - 100)
    let baseScore = (skillScore * skillWeight) + (interestMatch * interestWeight);

    // 4. Experience Level Penalty
    // If the candidate experience level is less than the job requirement, apply a penalty of 15% per level gap.
    let penalty = 0;
    if (userExpValue < jobExpValue) {
      penalty = (jobExpValue - userExpValue) * 15;
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(baseScore - penalty)));

    return {
      job,
      score: finalScore,
      matchedSkills,
      missingSkills
    };
  });
}

module.exports = { getRecommendations };
