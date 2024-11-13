import { useCallback, useEffect, useState } from "react";
import { HangmanDrawing } from "./HangmanDrawing";
import { HangmanWord } from "./HangmanWord";
import { Keyboard } from "./Keyboard";
import words from "./wordList.json";

function getWord() {
  return words[Math.floor(Math.random() * words.length)];
}

function App() {
  const [wordToGuess, setWordToGuess] = useState(getWord);
  const [guessedLetters, setGuessedLetters] = useState<string[]>([
    wordToGuess[0], // First letter
    wordToGuess[wordToGuess.length - 1], // Last letter
  ]);
  const [hint, setHint] = useState<{ partOfSpeech: string; definition: string } | null>(null);

  const incorrectLetters = guessedLetters.filter(
    letter => !wordToGuess.includes(letter)
  );

  const isLoser = incorrectLetters.length >= 6;
  const isWinner = wordToGuess
    .split("")
    .every(letter => guessedLetters.includes(letter));

  const addGuessedLetter = useCallback(
    (letter: string) => {
      if (guessedLetters.includes(letter) || isLoser || isWinner) return;
      setGuessedLetters(currentLetters => [...currentLetters, letter]);
    },
    [guessedLetters, isWinner, isLoser]
  );

  // Fetch the hint for the current word
  useEffect(() => {
    const fetchHint = async () => {
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${wordToGuess}`);
        const data = await response.json();
        
        if (data && data[0]?.meanings) {
          const meaning = data[0].meanings[0];
          setHint({
            partOfSpeech: meaning.partOfSpeech,
            definition: meaning.definitions[0].definition,
          });
        } else {
          setHint(null); // No hint if data is unavailable
        }
      } catch (error) {
        console.error("Failed to fetch hint:", error);
        setHint(null);
      }
    };

    fetchHint();
  }, [wordToGuess]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (!key.match(/^[a-z]$/)) return;

      e.preventDefault();
      addGuessedLetter(key);
    };

    document.addEventListener("keypress", handler);

    return () => {
      document.removeEventListener("keypress", handler);
    };
  }, [guessedLetters]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key;
      if (key !== "Enter") return;

      e.preventDefault();
      setGuessedLetters([wordToGuess[0], wordToGuess[wordToGuess.length - 1]]);
      setWordToGuess(getWord());
      setHint(null); // Reset hint for the new word
    };

    document.addEventListener("keypress", handler);

    return () => {
      document.removeEventListener("keypress", handler);
    };
  }, []);

  // Auto-reload the game after a win or loss
  useEffect(() => {
    if (isWinner || isLoser) {
      setTimeout(() => {
        setGuessedLetters([wordToGuess[0], wordToGuess[wordToGuess.length - 1]]);
        setWordToGuess(getWord());
        setHint(null); // Reset hint for the new word
      }, 2000); // 2-second delay before reloading
    }
  }, [isWinner, isLoser]);

  return (
    <div
      style={{
        maxWidth: "800px",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        margin: "0 auto",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Hint Card */}
      {hint && (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            backgroundColor: "#f1f1f1",
            borderRadius: "8px",
            padding: "1rem",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            maxWidth: "250px",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.2rem" }}>Hint</h3>
          <p style={{ margin: "0", fontWeight: "bold" }}>{hint.partOfSpeech}</p>
          <p style={{ margin: "0.5rem 0 0" }}>{hint.definition}</p>
        </div>
      )}

      <div style={{ fontSize: "2rem", textAlign: "center" }}>
        {isWinner && "Winner! - Reloading..."}
        {isLoser && "Nice Try - Reloading..."}
      </div>
      <HangmanDrawing numberOfGuesses={incorrectLetters.length} />
      <HangmanWord
        reveal={isLoser}
        guessedLetters={guessedLetters}
        wordToGuess={wordToGuess}
      />
      <div style={{ alignSelf: "stretch" }}>
        <Keyboard
          disabled={isWinner || isLoser}
          activeLetters={guessedLetters.filter(letter =>
            wordToGuess.includes(letter)
          )}
          inactiveLetters={incorrectLetters}
          addGuessedLetter={addGuessedLetter}
        />
      </div>
    </div>
  );
}

export default App;
