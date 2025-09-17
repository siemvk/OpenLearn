import { useState, useCallback, useMemo } from 'react';

// Seeded random number generator for deterministic results
const seededRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const useQuestionManagement = (rawlistdata: any[]) => {
  // Use useMemo for initial data processing
  const initialMappedData = useMemo(() => {
    if (!rawlistdata || !Array.isArray(rawlistdata) || rawlistdata.length === 0) {
      return [];
    }

    return rawlistdata
      .map((item) => {
        const vraag = item.vraag || item["1"] || "";
        const antwoord = item.antwoord || item["2"] || "";

        return {
          vraag: vraag,
          antwoord: antwoord,
        };
      })
      .filter((item) => item.vraag && item.antwoord);
  }, [rawlistdata]);

  // Create a deterministic shuffle based on list content
  const shuffleArray = useCallback(<T,>(array: T[]): T[] => {
    if (array.length === 0) return array;

    // Create a seed based on the array content for deterministic results
    let seed = 0;
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (item && typeof item === "object") {
        const str =
          ((item as any).vraag || (item as any)["1"] || "") +
          ((item as any).antwoord || (item as any)["2"] || "");
        for (let j = 0; j < str.length; j++) {
          seed = ((seed << 5) - seed + str.charCodeAt(j)) & 0xffffffff;
        }
      } else {
        const str = String(item || "");
        for (let j = 0; j < str.length; j++) {
          seed = ((seed << 5) - seed + str.charCodeAt(j)) & 0xffffffff;
        }
      }
    }

    // Use seeded random for deterministic shuffle
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(seed + i) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Initialize data with deterministic values to prevent hydration mismatch
  const [lijstData, setLijstData] = useState<any[]>(() => {
    if (!rawlistdata || !Array.isArray(rawlistdata) || rawlistdata.length === 0) {
      return [];
    }

    // Use deterministic shuffling based on content
    const mappedData = rawlistdata
      .map((item) => {
        const vraag = item.vraag || item["1"] || "";
        const antwoord = item.antwoord || item["2"] || "";

        return {
          vraag: vraag,
          antwoord: antwoord,
        };
      })
      .filter((item) => item.vraag && item.antwoord);

    // Generate deterministic seed from content
    let seed = 0;
    for (const item of mappedData) {
      const str = (item.vraag || "") + (item.antwoord || "");
      for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed + str.charCodeAt(i)) & 0xffffffff;
      }
    }

    // Deterministic shuffle using seeded random
    const shuffled = [...mappedData];
    for (let i = shuffled.length - 1; i > 0; i--) {
      let x = Math.sin(seed + i) * 10000;
      const random = x - Math.floor(x);
      const j = Math.floor(random * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  // Generate deterministic random number for multiple choice
  const generateRandomNumber = useCallback(() => {
    // Use current question content as seed for consistency
    let seed = 0;
    if (lijstData.length > 0) {
      const currentItem = lijstData[0];
      const str = (currentItem?.vraag || "") + (currentItem?.antwoord || "");
      for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed + str.charCodeAt(i)) & 0xffffffff;
      }
      // Add current list length to vary the seed when questions change
      seed += lijstData.length;
    }
    return Math.floor(seededRandom(seed) * 4) + 1;
  }, [lijstData]);

  // Get wrong answer options for multiple choice
  const getOptionText = useCallback(
    (buttonNumber: number, correctAnswer: string): string => {
      if (!initialMappedData || initialMappedData.length < 2) {
        return "Optie";
      }

      // Generate deterministic seed for wrong option selection
      let seed = buttonNumber * 1000; // Base seed on button number
      const str = correctAnswer;
      for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed + str.charCodeAt(i)) & 0xffffffff;
      }

      let attempts = 0;
      let randomAnswer = "";

      do {
        if (attempts > 10) {
          const randomIndex = Math.floor(
            seededRandom(seed + attempts) * initialMappedData.length
          );
          return initialMappedData[randomIndex]?.antwoord || "Optie";
        }

        attempts++;
        const randomIndex = Math.floor(
          seededRandom(seed + attempts) * initialMappedData.length
        );
        randomAnswer = initialMappedData[randomIndex]?.antwoord || "";
      } while (
        randomAnswer.toLowerCase() === correctAnswer.toLowerCase() ||
        randomAnswer === ""
      );

      return randomAnswer;
    },
    [initialMappedData]
  );

  // Get hint for current answer
  const getHint = useCallback((answer: string): string => {
    if (!answer || answer.length === 0) return "";

    // Make a working copy to avoid modifying original
    let workingAnswer = answer;

    // Handle parenthesized content - either show it as optional or remove it
    if (answer.includes("(") && answer.includes(")")) {
      // Show parenthesized content as optional in hint
      workingAnswer = workingAnswer.replace(/\(([^)]+)\)/g, "($1)");
    }

    // Check if the answer has multiple options (separated by slash or "of")
    if (workingAnswer.includes("/") || workingAnswer.includes(" of ")) {
      const parts = workingAnswer.split(/\s*(?:of|\/)\s*/);

      // Generate a hint for each alternative answer
      const hints = parts.map((part) => {
        return part
          .trim()
          .split(" ")
          .map((word) => {
            if (word.length === 0) return "";
            return word.charAt(0) + "_".repeat(word.length - 1);
          })
          .join(" ");
      });

      // Join the hints with the same separator that was in the original answer
      return workingAnswer.includes("/") ? hints.join(" / ") : hints.join(" of ");
    }

    // Original behavior for single answers
    return workingAnswer
      .split(" ")
      .map((word) => {
        if (word.length === 0) return "";
        return word.charAt(0) + "_".repeat(word.length - 1);
      })
      .join(" ");
  }, []);

  return {
    initialMappedData,
    lijstData,
    setLijstData,
    shuffleArray,
    generateRandomNumber,
    getOptionText,
    getHint,
  };
};