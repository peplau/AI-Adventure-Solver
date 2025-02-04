function sendKeyToMSX(key, keyCode) {
    const keyboard = window.WMSX.room.controllersHub.getKeyboard();
    keyboard.logKeyEvents = true;

    let keyName = charToWebMSXKey(key);
    if (keyName==null){
        keyName = key.toUpperCase()
    }

    keyboard.processMSXKey(keyName, true);
    setTimeout(() => keyboard.processMSXKey(keyName, false), keyPressDelay);
}

function typeText(text) {
    if (!text.endsWith('\n')) {
        text += '\n';
    }
    const numberOfCommands = text.split("\n").length - 1;

    let index = 0;
    const interval = setInterval(() => {
        if (index < text.length) {
            sendKeyToMSX(text[index],text[index]); 
            index++;
        } else {
            clearInterval(interval);
        }
    }, textTypeDelay); 

    return numberOfCommands;
}

function pressMultipleKeys(keys) {
    let index = 0;
    const interval = setInterval(() => {
        if (index < keys.length) {
            sendSpecialKey(keys[index].keyValue, keys[index].keyCode);
            index++;
        } else {
            clearInterval(interval);
        }
    }, multiKeyPressDelay); // Delay between keypresses
}

function charToWebMSXKey(char) {
    const map = {
        "A": "A", "B": "B", "C": "C", "D": "D", "E": "E",
        "F": "F", "G": "G", "H": "H", "I": "I", "J": "J",
        "K": "K", "L": "L", "M": "M", "N": "N", "O": "O",
        "P": "P", "Q": "Q", "R": "R", "S": "S", "T": "T",
        "U": "U", "V": "V", "W": "W", "X": "X", "Y": "Y",
        "Z": "Z", "Ã": "Ã", "Ç": "Ç", "É": "É", "Ê": "Ê",
        "\"": "QUOTE", "'": "QUOTE", "=": "EQUAL", "+": "NUM_PLUS", "-": "NUM_MINUS",
        "/": "NUM_DIVIDE", ";": "SEMICOLON",
        " ": "SPACE", ".": "PERIOD", ",": "COMMA",
        "!": "SHIFT_1", "?": "SHIFT_SLASH",
        "1": "D1", "2": "D2", "3": "D3", "4": "D4", "5": "D5",
        "6": "D6", "7": "D7", "8": "D8", "9": "D9", "0": "D0",
        "\n": "ENTER", "\r": "ENTER"  // Handle new lines
    };

    return map[char.toUpperCase()] || null;
}