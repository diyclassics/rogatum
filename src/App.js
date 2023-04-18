import React, { useState, useEffect, useCallback } from "react";
import paragraphs from "./paragraphs.json";
import axios from "axios";
import stringSimilarity from "string-similarity";
import "bootstrap/dist/css/bootstrap.min.css";


const App = () => {
    const [paragraph, setParagraph] = useState("");
    const [question, setQuestion] = useState("");
    const [correctAnswer, setCorrectAnswer] = useState("");
    const [userAnswer, setUserAnswer] = useState("");
    const [result, setResult] = useState("");
    const [score, setScore] = useState(0);
    const [quit, setQuit] = useState("");


    const generateQuestion = useCallback(
        async (paragraph) => {
            try {
                const prompt = `Generate a reading comprehension question in Latin with a one-word answer (format Question|Answer) based any sentence in the following paragraph:\n\n${paragraph}\n\nQuestion: `;
                const response = await axios.post(
                    "https://api.openai.com/v1/chat/completions",
                    {
                        "model": "gpt-3.5-turbo",

                        "messages": [{ "role": "user", "content": prompt }],
                        "temperature": 0.9,
                        "max_tokens": 50,
                        "stop": "\n"
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
                        },
                    }
                );

                console.log(response.data.choices);

                if (response.data.choices && response.data.choices.length > 0) {
                    const generatedResponse = response.data.choices[0].message.content.trim();
                    const [generatedQuestion, generatedAnswer] = generatedResponse.split('|');
                    console.log("Generated question:", generatedQuestion);
                    setQuestion(generatedQuestion);
                    setCorrectAnswer(generatedAnswer.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));
                } else {
                    console.error("No question generated");
                }

            } catch (error) {
                console.error("Error generating question:", error);
            }
        },
        []
    );

    const handleAnswerSubmit = async (event) => {
        event.preventDefault();

        if (!userAnswer) return;

        // Compare the user's answer with the correct answer
        const similarity = stringSimilarity.compareTwoStrings(userAnswer.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""), correctAnswer.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")); // eslint-disable-line

        console.log("User answer:", userAnswer)
        console.log("Correct answer:", correctAnswer)
        console.log("Similarity:", similarity)

        // Determine if the user's answer is correct based on the similarity score
        if (similarity > 0.7) {
            setResult("Correct!");
            setScore(score + 1)
        } else {
            setResult("Incorrect! The correct answer is " + correctAnswer + ".");
        }

        // Reset the user's answer input
        setUserAnswer("");

        // Load a new question
        await generateQuestion(paragraph);
    };

    const handleQuit = () => {
        setParagraph("");
        setQuestion("");
        setUserAnswer("");
        setCorrectAnswer("");
        setResult("");
        setScore(0);
        setQuit(true);
    };

    const getRandomParagraph = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * paragraphs.length);
        const randomParagraph = paragraphs[randomIndex].text;
        setParagraph(randomParagraph);
        generateQuestion(randomParagraph);
    }, [generateQuestion]);

    useEffect(() => {
        getRandomParagraph();
    }, [getRandomParagraph]);


    return (
        <div className="container mt-5">
            <h2 className="text-center mb-5">React GPT-3 Latin Reading Comprehension App</h2>
            <p><i>Task: Given a random paragraph from Hyginus' Fabulae, generate reading comprehension questions/answers without further prompting.</i></p>
            <p>{paragraph}</p>
            <p>{question}</p>
            <div className="input-group mb-3">
                <input
                    type="text"
                    className="form-control"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Enter your answer"
                />
                <button className="btn btn-primary" onClick={handleAnswerSubmit}>
                    Submit
                </button>
            </div>
            <p>{result}</p>
            <p>Score: {score}</p>
            <div className="d-grid gap-2">
                <button className="btn btn-secondary mb-2" onClick={getRandomParagraph}>
                    New Paragraph
                </button>
                <button className="btn btn-danger" onClick={handleQuit}>
                    Quit
                </button>
            </div>
        </div>
    );
};

export default App;