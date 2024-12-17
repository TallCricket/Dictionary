const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultDiv = document.getElementById("result");
const errorMsg = document.getElementById("errorMsg");
const suggestionsDiv = document.createElement("div"); // Suggestions container

suggestionsDiv.className = "bg-white border rounded shadow-md absolute w-3/4 md:w-1/2 z-10 hidden suggestions-box";
document.body.appendChild(suggestionsDiv); // Add suggestions div to the page

// Event Listeners
searchInput.addEventListener("input", () => fetchSuggestions(searchInput.value));
searchInput.addEventListener("blur", () => setTimeout(() => suggestionsDiv.classList.add("hidden"), 200));

// Trigger search when Enter key is pressed
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        fetchMeaning(searchInput.value.trim());
    }
});

// Search button click
searchBtn.addEventListener("click", () => {
    const word = searchInput.value.trim();
    if (word) {
        fetchMeaning(word);
    } else {
        showError("Please enter a word!");
    }
});

// Fetch word suggestions from Datamuse API
async function fetchSuggestions(input) {
    if (input.length === 0) {
        suggestionsDiv.classList.add("hidden");
        return;
    }

    const url = `https://api.datamuse.com/sug?s=${input}`;
    try {
        const response = await fetch(url);
        const suggestions = await response.json();

        // Display suggestions
        suggestionsDiv.innerHTML = "";
        suggestions.slice(0, 5).forEach((suggestion) => {
            const div = document.createElement("div");
            div.textContent = suggestion.word;
            div.className = "p-2 hover:bg-blue-100 cursor-pointer border-b last:border-0";
            div.addEventListener("click", () => {
                searchInput.value = suggestion.word;
                suggestionsDiv.classList.add("hidden");
                fetchMeaning(suggestion.word); // Automatically search when a suggestion is clicked
            });
            suggestionsDiv.appendChild(div);
        });

        // Positioning Suggestions Div
        const rect = searchInput.getBoundingClientRect();
        suggestionsDiv.style.top = `${rect.bottom + window.scrollY}px`;
        suggestionsDiv.style.left = `${rect.left + window.scrollX}px`;
        suggestionsDiv.classList.remove("hidden");
    } catch (error) {
        console.error("Suggestion Error:", error);
    }
}

// Fetch data from Free Dictionary API
async function fetchMeaning(word) {
    const correctedWord = await autoCorrect(word);
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${correctedWord}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Word not found!");

        const data = await response.json();
        displayResult(data[0]);
    } catch (error) {
        showError(`Word "${word}" not found! Did you mean "${correctedWord}"?`);
    }
}

// Auto-correct word using Datamuse API
async function autoCorrect(word) {
    const url = `https://api.datamuse.com/sug?s=${word}`;
    try {
        const response = await fetch(url);
        const suggestions = await response.json();
        return suggestions.length > 0 ? suggestions[0].word : word;
    } catch (error) {
        console.error("Auto-Correction Error:", error);
        return word;
    }
}

// Display word details
async function displayResult(wordData) {
    errorMsg.classList.add("hidden");
    resultDiv.classList.remove("hidden");

    const title = document.getElementById("wordTitle");
    const phonetic = document.getElementById("wordPhonetic");
    const audioPlayer = document.getElementById("audioPlayer");
    const meaningsDiv = document.getElementById("meanings");

    title.textContent = wordData.word;
    phonetic.textContent = wordData.phonetic || "";

    // Audio Pronunciation
    if (wordData.phonetics[0]?.audio) {
        audioPlayer.src = wordData.phonetics[0].audio;
        audioPlayer.classList.remove("hidden");
    } else {
        audioPlayer.classList.add("hidden");
    }

    // Meanings
    meaningsDiv.innerHTML = "";
    for (const meaning of wordData.meanings) {
        const englishDefinition = meaning.definitions[0].definition;
        const hindiTranslation = await translateToHindi(englishDefinition);

        meaningsDiv.innerHTML += `
            <div class="mb-4">
                <h3 class="font-medium text-blue-600">${meaning.partOfSpeech}</h3>
                <p><strong>English:</strong> ${englishDefinition}</p>
                <p><strong>Hindi:</strong> ${hindiTranslation}</p>
            </div>
        `;
    }
}

// Translate English to Hindi
async function translateToHindi(text) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data[0][0][0];
    } catch (error) {
        console.error("Translation Error:", error);
        return "अनुवाद उपलब्ध नहीं है";
    }
}

// Display Error
function showError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.remove("hidden");
    resultDiv.classList.add("hidden");
}
