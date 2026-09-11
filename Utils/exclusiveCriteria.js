import moment from "moment";
import User from "../Models/user.js";
import personalDetails from "../Models/personalDetails.model.js";
import qualificationDetails from "../Models/qualificationDetails.model.js";
import otherDetails from "../Models/otherDetails.model.js";
import Recommendation from "../Models/recommendation.model.js";

/**
 * 7 Exclusive profile eligibility criteria
 */
export const EXCLUSIVE_CRITERIA_LIST = [
    {
        id: "age_gender",
        title: "Minimum age of 18 years for females and 21 years for males.",
        category: "profile",
    },
    {
        id: "annual_income",
        title: "Minimum annual income of $100,000+.",
        category: "profile",
    },
    {
        id: "qualification",
        title: "Graduate degree or higher qualification.",
        category: "profile",
    },
    {
        id: "professional_achievements",
        title: "Demonstrated professional achievements or an established career in a reputable industry.",
        category: "profile_and_declaration",
    },
    {
        id: "community_family_values",
        title: "Background aligned with strong community and family values.",
        category: "declaration",
    },
    {
        id: "no_criminal_background",
        title: "No criminal background.",
        category: "declaration",
    },
    {
        id: "verification_willingness",
        title: "Willingness to undergo comprehensive profile verification, including identity and occupation checks, where required.",
        category: "declaration",
    },
];

/**
 * Parse income string and determine if it meets minimum $100,000+
 */
export function isIncomeEligible(incomeVal) {
    if (incomeVal === null || incomeVal === undefined) return false;

    const normalized = String(incomeVal).toLowerCase().replace(/au\$|\$|,/g, "").trim();

    // Support "100k", "150k+", etc.
    if (/(1\d{2}|[2-9]\d{2}|\d{4,})k/i.test(normalized)) return true;

    const numbers = normalized.match(/\d+/g)?.map(Number) || [];
    if (numbers.length === 0) return false;

    if (/up to/i.test(normalized)) {
        return numbers[0] >= 100000;
    }

    if (/more than|\+/i.test(normalized)) {
        return numbers.some((n) => n >= 100000);
    }

    if (normalized.includes("-")) {
        const [min, max] = numbers;
        return min >= 100000 || (max && max >= 100000);
    }

    return numbers.some((n) => n >= 100000);
}

/**
 * Determine if qualification is graduate degree or higher
 */
export function isQualificationEligible(qualVal) {
    if (qualVal === null || qualVal === undefined) return false;

    const q = String(qualVal).toLowerCase().trim();

    // Below graduate patterns
    const belowGraduatePattern =
        /^(high\s?school|secondary|higher\s?secondary|10th|12th|matric|matriculation|below\s?matriculation|primary|middle\s?school|none|illiterate)$/i;
    if (belowGraduatePattern.test(q)) return false;

    // Graduate degree or higher patterns
    const graduatePattern =
        /bachelor|master|doctor|phd|post\s?grad|graduate|degree|b\.?tech|m\.?tech|b\.?e|m\.?e|b\.?sc|m\.?sc|mba|mca|bca|mbbs|md|ms|llb|llm|ca|cpa|engineering|b\.?com|m\.?com|b\.?a|m\.?a|pg\s?diploma|diploma/i;
    return graduatePattern.test(q);
}

/**
 * Validates whether the given user meets all criteria for the Exclusive plan
 */
export async function validateExclusiveEligibility(userId, payload = {}) {
    const user = await User.findOne({ where: { userId } });
    if (!user) {
        return {
            isEligible: false,
            message: "User profile not found.",
            unmatchedCriteria: ["User profile not found."],
            details: [],
        };
    }

    // Check profile form completeness
    if (!user.isPersonalFormFilled || !user.isQualificationFormFilled || !user.isOtherFormFilled) {
        const missingSections = [];
        if (!user.isPersonalFormFilled) missingSections.push("Personal Details");
        if (!user.isQualificationFormFilled) missingSections.push("Qualification Details");
        if (!user.isOtherFormFilled) missingSections.push("Other Details");

        const msg = `Please complete your profile sections (${missingSections.join(
            ", "
        )}) before applying for the Exclusive plan.`;

        return {
            isEligible: false,
            message: msg,
            unmatchedCriteria: [msg],
            details: [
                {
                    id: "profile_completion",
                    title: "Profile Completion",
                    satisfied: false,
                    message: msg,
                },
            ],
        };
    }

    // Fetch user related details
    const [personal, qualification, other, rec] = await Promise.all([
        personalDetails.findOne({ where: { userId } }),
        qualificationDetails.findOne({ where: { userId } }),
        otherDetails.findOne({ where: { userId } }),
        Recommendation.findOne({ where: { userId } }),
    ]);

    const details = [];
    const unmatchedCriteria = [];

    const { acceptedCriteria, declarations } = payload;
    const acceptedList = Array.isArray(acceptedCriteria)
        ? acceptedCriteria.map((c) => String(c).toLowerCase().trim())
        : null;

    // -------------------------------------------------------------
    // 1. Age & Gender: Min 18 for females and 21 for males
    // -------------------------------------------------------------
    const gender = (rec?.gender || personal?.gender || "").toLowerCase().trim();
    const isFemale = /female|woman/i.test(gender);
    const isMale = /male|man/i.test(gender);
    const minRequiredAge = isFemale ? 18 : 21;

    let userAge = null;
    if (other?.dateOfBirth) {
        const dob = moment(
            other.dateOfBirth,
            ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY", "MM/DD/YYYY", moment.ISO_8601],
            true
        );
        if (dob.isValid()) {
            userAge = moment().diff(dob, "years");
        } else {
            const fallbackDob = moment(other.dateOfBirth);
            if (fallbackDob.isValid()) {
                userAge = moment().diff(fallbackDob, "years");
            }
        }
    }
    if (userAge === null && rec?.age) {
        const parsed = parseInt(rec.age);
        if (!isNaN(parsed)) userAge = parsed;
    }

    let ageSatisfied = false;
    let ageMessage = "";
    if (userAge === null) {
        ageSatisfied = false;
        ageMessage = "Date of birth or age is missing from your profile.";
    } else if (userAge < minRequiredAge) {
        ageSatisfied = false;
        ageMessage = `Minimum age of ${minRequiredAge} years is required for ${
            isFemale ? "females" : "males"
        } (Your age: ${userAge}).`;
    } else {
        ageSatisfied = true;
        ageMessage = `Age verified: ${userAge} years (${isFemale ? "Female" : isMale ? "Male" : "Verified"}).`;
    }

    if (
        acceptedList &&
        !acceptedList.some(
            (a) => a.includes("age") || a.includes("18") || a.includes("21") || a === "age_gender"
        )
    ) {
        ageSatisfied = false;
        ageMessage = "Criterion 'Minimum age of 18 years for females and 21 years for males' was not confirmed.";
    }

    details.push({
        id: "age_gender",
        title: "Minimum age of 18 years for females and 21 years for males.",
        satisfied: ageSatisfied,
        message: ageMessage,
    });
    if (!ageSatisfied) unmatchedCriteria.push(ageMessage);

    // -------------------------------------------------------------
    // 2. Minimum annual income of $100,000+
    // -------------------------------------------------------------
    const incomeVal = qualification?.income || rec?.income || "";
    const incomeEligible = isIncomeEligible(incomeVal);
    let incomeSatisfied = incomeEligible;
    let incomeMessage = "";

    if (!incomeVal) {
        incomeSatisfied = false;
        incomeMessage =
            "Annual income is missing in your profile. Minimum annual income of $100,000+ is required.";
    } else if (!incomeEligible) {
        incomeSatisfied = false;
        incomeMessage = `Minimum annual income of $100,000+ is required (Your profile income: ${incomeVal}).`;
    } else {
        incomeSatisfied = true;
        incomeMessage = `Annual income verified: ${incomeVal}.`;
    }

    if (
        acceptedList &&
        !acceptedList.some(
            (a) => a.includes("income") || a.includes("100,000") || a === "annual_income"
        )
    ) {
        incomeSatisfied = false;
        incomeMessage = "Criterion 'Minimum annual income of $100,000+' was not confirmed.";
    }

    details.push({
        id: "annual_income",
        title: "Minimum annual income of $100,000+.",
        satisfied: incomeSatisfied,
        message: incomeMessage,
    });
    if (!incomeSatisfied) unmatchedCriteria.push(incomeMessage);

    // -------------------------------------------------------------
    // 3. Graduate degree or higher qualification
    // -------------------------------------------------------------
    const qualVal = qualification?.qualification || rec?.qualification || "";
    const qualEligible = isQualificationEligible(qualVal);
    let qualSatisfied = qualEligible;
    let qualMessage = "";

    if (!qualVal) {
        qualSatisfied = false;
        qualMessage =
            "Qualification is missing in your profile. Graduate degree or higher qualification is required.";
    } else if (!qualEligible) {
        qualSatisfied = false;
        qualMessage = `Graduate degree or higher qualification is required (Your profile qualification: ${qualVal}).`;
    } else {
        qualSatisfied = true;
        qualMessage = `Qualification verified: ${qualVal}.`;
    }

    if (
        acceptedList &&
        !acceptedList.some(
            (a) => a.includes("graduat") || a.includes("qualification") || a === "qualification"
        )
    ) {
        qualSatisfied = false;
        qualMessage = "Criterion 'Graduate degree or higher qualification' was not confirmed.";
    }

    details.push({
        id: "qualification",
        title: "Graduate degree or higher qualification.",
        satisfied: qualSatisfied,
        message: qualMessage,
    });
    if (!qualSatisfied) unmatchedCriteria.push(qualMessage);

    // -------------------------------------------------------------
    // 4. Demonstrated professional achievements or established career
    // -------------------------------------------------------------
    const workingStatus = qualification?.currentWorkingStatus || "";
    let careerSatisfied = true;
    let careerMessage = "Professional career and working status acknowledged.";

    if (workingStatus && /not working|unemployed/i.test(workingStatus)) {
        if (
            !declarations?.professionalAchievements &&
            (!acceptedList || !acceptedList.includes("professional_achievements"))
        ) {
            careerSatisfied = false;
            careerMessage =
                "Demonstrated professional achievements or an established career in a reputable industry is required.";
        }
    }

    if (
        acceptedList &&
        !acceptedList.some(
            (a) =>
                a.includes("career") ||
                a.includes("achievement") ||
                a.includes("professional") ||
                a === "professional_achievements"
        )
    ) {
        careerSatisfied = false;
        careerMessage =
            "Criterion 'Demonstrated professional achievements or an established career in a reputable industry' was not confirmed.";
    }

    details.push({
        id: "professional_achievements",
        title: "Demonstrated professional achievements or an established career in a reputable industry.",
        satisfied: careerSatisfied,
        message: careerMessage,
    });
    if (!careerSatisfied) unmatchedCriteria.push(careerMessage);

    // -------------------------------------------------------------
    // 5. Background aligned with strong community and family values
    // -------------------------------------------------------------
    let valuesSatisfied = true;
    let valuesMessage = "Background aligned with strong community and family values acknowledged.";

    if (declarations && declarations.communityFamilyValues === false) {
        valuesSatisfied = false;
        valuesMessage = "Background must be aligned with strong community and family values.";
    }

    if (
        acceptedList &&
        !acceptedList.some(
            (a) =>
                a.includes("community") ||
                a.includes("family") ||
                a.includes("values") ||
                a === "community_family_values"
        )
    ) {
        valuesSatisfied = false;
        valuesMessage =
            "Criterion 'Background aligned with strong community and family values' was not confirmed.";
    }

    details.push({
        id: "community_family_values",
        title: "Background aligned with strong community and family values.",
        satisfied: valuesSatisfied,
        message: valuesMessage,
    });
    if (!valuesSatisfied) unmatchedCriteria.push(valuesMessage);

    // -------------------------------------------------------------
    // 6. No criminal background
    // -------------------------------------------------------------
    let criminalSatisfied = true;
    let criminalMessage = "No criminal background declaration acknowledged.";

    if (
        declarations &&
        (declarations.noCriminalBackground === false || declarations.hasCriminalBackground === true)
    ) {
        criminalSatisfied = false;
        criminalMessage = "Applicants must have no criminal background for an Exclusive profile.";
    }

    if (
        acceptedList &&
        !acceptedList.some((a) => a.includes("criminal") || a === "no_criminal_background")
    ) {
        criminalSatisfied = false;
        criminalMessage = "Criterion 'No criminal background' was not confirmed.";
    }

    details.push({
        id: "no_criminal_background",
        title: "No criminal background.",
        satisfied: criminalSatisfied,
        message: criminalMessage,
    });
    if (!criminalSatisfied) unmatchedCriteria.push(criminalMessage);

    // -------------------------------------------------------------
    // 7. Willingness to undergo comprehensive profile verification
    // -------------------------------------------------------------
    let verifSatisfied = true;
    let verifMessage = "Willingness to undergo profile verification acknowledged.";

    if (declarations && declarations.willingnessForVerification === false) {
        verifSatisfied = false;
        verifMessage =
            "Willingness to undergo comprehensive profile verification is required.";
    }

    if (
        acceptedList &&
        !acceptedList.some(
            (a) =>
                a.includes("verification") ||
                a.includes("identity") ||
                a === "verification_willingness"
        )
    ) {
        verifSatisfied = false;
        verifMessage =
            "Criterion 'Willingness to undergo comprehensive profile verification' was not confirmed.";
    }

    details.push({
        id: "verification_willingness",
        title: "Willingness to undergo comprehensive profile verification, including identity and occupation checks, where required.",
        satisfied: verifSatisfied,
        message: verifMessage,
    });
    if (!verifSatisfied) unmatchedCriteria.push(verifMessage);

    const isEligible = unmatchedCriteria.length === 0;
    const message = isEligible
        ? "You are eligible to purchase the Exclusive plan."
        : (unmatchedCriteria.length === 1 ? unmatchedCriteria[0] : unmatchedCriteria.join(" "));

    return {
        isEligible,
        message,
        unmatchedCriteria,
        details,
    };
}
