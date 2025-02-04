const settingsFields = document.querySelectorAll("#panel2 input, #panel2 textarea, #panel2 select");
const saveButton = document.getElementById("saveSettings");
const settingsKey = "adventureSolverSettings";

var openAIApiKey;
var screenAnalysisPrompt;
var diskaUrl; var cartridge1Url; var preload;
var machine; var keyPressDelay; var textTypeDelay;
var multiKeyPressDelay; var imageAnalysisMaxTokens; var model;
var maxRounds; var roundDelay; var gameWalkthrough;

function loadSettingsVariables(){
    openAIApiKey = document.getElementById("openaiApiKey").value;
    diskaUrl = document.getElementById("diskaUrl").value;
    cartridge1Url = document.getElementById("cartridge1Url").value;
    preload = document.getElementById("preload").value;
    if(preload.includes(".dsk")){ 
        diskaUrl = preload;
    } else if(preload.includes(".rom")){
        cartridge1Url = preload;
    }
    machine = document.getElementById("machine").value;
    keyPressDelay = document.getElementById("keyPressDelay").value;
    textTypeDelay = document.getElementById("textTypeDelay").value;
    multiKeyPressDelay = document.getElementById("multiKeyPressDelay").value;
    imageAnalysisMaxTokens = document.getElementById("imageAnalysisMaxTokens").value;
    model = document.getElementById("model").value;
    maxRounds = document.getElementById("maxRounds").value;
    roundDelay = document.getElementById("roundDelay").value;
    screenAnalysisPrompt = document.getElementById("screenAnalysisPrompt").value;
    gameWalkthrough = document.getElementById("gameWalkthrough").value;
}

document.addEventListener("DOMContentLoaded", function() {
    // Load Settings
    loadSettings();
    loadSettingsVariables();

    // If empty, load the prompt by default
    const promptField = document.getElementById("screenAnalysisPrompt");
    if (promptField.value==""){
        promptField.value = defaultScreenAnalysisPrompt;    
    }

    // Setup & Start Emulator
    WMSX.DISKA_URL = diskaUrl;
    WMSX.CARTRIDGE1_URL = cartridge1Url;
    WMSX.MACHINE = machine;
    WMSX.start();
});

settingsFields.forEach(field => {
    field.addEventListener("input", () => {
        saveButton.disabled = false;
    });
});

function saveSettings() {
    const settings = {};
    settingsFields.forEach(field => {
        settings[field.id] = field.value;
    });
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    saveButton.disabled = true;
}

function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem(settingsKey)) || {};
    settingsFields.forEach(field => {
        if (savedSettings[field.id] !== undefined) {
            field.value = savedSettings[field.id];
        }
    });
}