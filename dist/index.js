var round = 0;
var logs;
var contextMessages = [];

// Configure MSX
WMSX.AUTO_START = false;

document.addEventListener("DOMContentLoaded", function() {
    logs = document.getElementById("logs");
});

function captureScreenshot(newWidth) {
    const container = document.getElementById("wmsx");
    const msxCanvas = container.querySelector("canvas");

    // Get original dimensions
    const originalWidth = msxCanvas.width;
    const originalHeight = msxCanvas.height;

    // Determine target dimensions
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (typeof newWidth === 'number' && newWidth > 0) {
        // Keep aspect ratio
        const aspectRatio = originalHeight / originalWidth;
        targetWidth = newWidth;
        targetHeight = Math.round(aspectRatio * newWidth);
    }

    // Create an off-screen canvas and context
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = targetWidth;
    offscreenCanvas.height = targetHeight;
    const ctx = offscreenCanvas.getContext("2d");

    // Draw the MSX canvas onto the off-screen canvas, resizing if needed
    ctx.drawImage(msxCanvas, 0, 0, targetWidth, targetHeight);

    // Convert to a base64 image
    const imageDataURL = offscreenCanvas.toDataURL("image/png");

    // Optionally create an <img> element
    const img = document.createElement("img");
    img.src = imageDataURL;

    return {
        imageElement: img,
        imageBase64: imageDataURL
    };
}

async function testOcr() {
    debugger;

    // OCR Title
    var title = document.createElement("h6");
    title.innerText = "Running OCR... ";
    logs.appendChild(title);

    // Image
    var imageReturn = captureScreenshot(1024);
    var image = imageReturn.imageElement;
    var base64 = imageReturn.imageBase64;
    logs.appendChild(image);
    requestAnimationFrame(() => {
        logs.scrollTop = logs.scrollHeight;
    });

    // Run OCR on image
    recognizedText = await ocrImage(base64, openAIApiKey);

    // Output recognized text
    var container = document.createElement("pre");
    container.innerText = recognizedText;
    logs.appendChild(container);
    logs.appendChild(document.createElement("hr"));
    requestAnimationFrame(() => {
        logs.scrollTop = logs.scrollHeight;
    });
}

async function ocrImage(base64Image, apiKey) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a OCR engine, please review the image and bring the exact text extracted from it.
                    Return only the text extracted and nothing more.`
                },
                {
                    role: "user",
                    content: [{ type: "image_url", image_url: { "url": base64Image } }]
                }
            ]
        })
    });
    const data = await response.json();
    var ocrText = data.choices[0].message.content;
    if(ocrText.includes('```\n')) {
        ocrText = ocrText.replace('```\n',"").replace("```","");
    }
    return ocrText;
}

async function analyzeScreen(ocrText, previousContext, apiKey) {
    // Compile the message content
    var messageContent = [];
    for (let ind = 0; ind < previousContext.length; ind++) {
        const roundEntry = JSON.stringify(previousContext[ind]);
        const roundNum = ind+1;
        messageContent[ind] = { type: "text", text: "Round "+roundNum+": "+roundEntry };
    }

    // Build messages array
    var submitBody = {
        model: model,
        messages: []
    };
    if(model.indexOf("o1")>=0){
        messageContent[messageContent.length]  = { type: "text", text: "Description: "+ocrText };
        messageContent[messageContent.length]  = { type: "text", text: screenAnalysisPrompt + "--\n--" +gameWalkthrough };
    } else {
        messageContent[messageContent.length]  = { type: "text", text: "Description: "+ocrText };
        submitBody.max_tokens = parseInt(imageAnalysisMaxTokens);
        submitBody.messages[submitBody.messages.length] =  { role: "developer", content: screenAnalysisPrompt };
        submitBody.messages[submitBody.messages.length] =  { role: "system", content: gameWalkthrough };
    }
    submitBody.messages[submitBody.messages.length] =  { role: "user", content: messageContent };

    // Send to OpenAI API for analysis
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(submitBody)
    });

    const data = await response.json();
    var jsonString = data.choices[0].message.content;
    if(jsonString.includes("```json")) {
        jsonString = jsonString.replace("```json","").replace("```","");
    }
    var returnjson = JSON.parse(jsonString);
    return returnjson;
}

function testType(){
    var phrase = "123!+\r";
    alert("Will inject: '"+phrase+"'");
    typeText(phrase);
}

async function runSolver() {
    round++;

    // Round Title
    var roundTitle = document.createElement("h5");
    roundTitle.innerText = "Round "+round;
    logs.appendChild(roundTitle);

    // Image
    var imageReturn = captureScreenshot(250);
    var image = imageReturn.imageElement;
    var base64 = imageReturn.imageBase64;
    logs.appendChild(image);
    requestAnimationFrame(() => {
        logs.scrollTop = logs.scrollHeight;
    });
 
    // OCR the image
    var ocrText = await ocrImage(base64,openAIApiKey);
    image.alt = ocrText;
    var imageDescriptionContainer = document.createElement("div");
    imageDescriptionContainer.innerHTML = "<h6>OCR Text:</h6> "+ocrText;
    logs.appendChild(imageDescriptionContainer);
    requestAnimationFrame(() => {
        logs.scrollTop = logs.scrollHeight;
    });

    // Send image to ChatGPT to be processed
    var nextAction = await analyzeScreen(ocrText, contextMessages, openAIApiKey);
    var actionType = nextAction.type;
    var actionOutput = nextAction.output;

    // Store into the messages history
    contextMessages[contextMessages.length] = {screen:ocrText, action:nextAction};

    // Add next action to the logs
    var nextActionContainer = document.createElement("div");
    nextActionContainer.innerHTML = "<h6>Next Action:</h6> "+JSON.stringify(nextAction);
    logs.appendChild(nextActionContainer);
    logs.appendChild(document.createElement("hr"));
    requestAnimationFrame(() => {
        logs.scrollTop = logs.scrollHeight;
    });

    // Execute the next action
    return executeAction(actionType, actionOutput);
}

async function executeAction(actionType, actionOutput) {
    var commands = 1;
    if (actionType=="text") {
        commands = typeText(actionOutput);
    } else if(actionType=="special") {
        sendKeyToMSX(actionOutput.keyValue, actionOutput.keyCode);
    } else if(actionType=="multi") {
        setTimeout(() => {
            pressMultipleKeys(actionOutput);
        }, 3000);
    } else if(actionType=="gameover") {
        stopSolver();
    }
    return commands;
}

var isRunning = false;

async function startSolver() {
    isRunning = true;

    // Disable START / Enable STOP
    document.getElementById("startBtn").setAttribute("disabled","disabled");
    document.getElementById("stopBtn").removeAttribute("disabled");

    // Load settings variables
    loadSettingsVariables();

    // Process Loop
    await processLoop();
}

async function processLoop(){
    // Abort loop after the maxRounds exceeds
    if (round >= maxRounds){
        await stopSolver();
    }
    else if (isRunning) {
        var commands = await runSolver();
        var delayToWait = roundDelay * commands;
        setTimeout(() => {
            processLoop();
        }, delayToWait);
    }
}

async function stopSolver() {
    isRunning = false;

    // Enable START / Disable STOP
    document.getElementById("startBtn").removeAttribute("disabled");
    document.getElementById("stopBtn").setAttribute("disabled","disabled");
}