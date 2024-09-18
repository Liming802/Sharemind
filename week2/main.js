const canvas = document.createElement('canvas');
canvas.setAttribute('id', 'myCanvas');
canvas.style.position = 'absolute';
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.left = '0';
canvas.style.top = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
document.body.appendChild(canvas);
console.log('canvas', canvas.width, canvas.height);
let i=0;
// Store the positions of all input boxes to avoid overlap
const inputBoxPositions = [];

// Function to create a random position within the window, ensuring no overlap
function getRandomPosition() {
    let randomX, randomY, overlap;
    const boxWidth = 200; // Approximate width of input box
    const boxHeight = 50; // Approximate height of input box
    do {
        // Generate random x and y positions
        randomX = Math.random() * (window.innerWidth - boxWidth);
        randomY = Math.random() * (window.innerHeight - boxHeight);
        // Check if this position overlaps with any existing positions
        overlap = inputBoxPositions.some(pos => {
            return Math.abs(pos.x - randomX) < boxWidth && Math.abs(pos.y - randomY) < boxHeight;
        });

    } while (overlap); // Keep generating new positions until there's no overlap

    // Save this position for future comparisons
    inputBoxPositions.push({ x: randomX, y: randomY });

    return { x: randomX, y: randomY };
}

// Function to create an input box
function createInputBox() {
 
    const inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');
    inputBox.setAttribute('id', 'inputBox');
    inputBox.setAttribute('placeholder', 'Enter text here');
    inputBox.style.position = 'absolute';
    inputBox.style.zIndex = '100';
    inputBox.style.fontSize = '30px';
    inputBox.style.fontFamily = 'Arial';

    // Get a random position for the new input box
    const randomPos = getRandomPosition();
    if(i!=0){
    inputBox.style.left = `${randomPos.x}px`;
    inputBox.style.top = `${randomPos.y}px`;}
    else{
        inputBox.style.left = `40%`;
        inputBox.style.top = `50%`;   
    }
    document.body.appendChild(inputBox);

    // Add event listener to the input box
    inputBox.addEventListener('keydown', function (event) {
        // Check if the Enter key is pressed
        if (event.key === 'Enter') {
            i+=1;
            const inputValue = inputBox.value;
            const ctx = canvas.getContext('2d');
            ctx.font = '30px Arial';
            const inputBoxRect = inputBox.getBoundingClientRect();
            const x = inputBoxRect.left;
            const y = inputBoxRect.top;
            ctx.fillStyle = 'black';
            ctx.fillText(inputValue, x, y);

            // Clear the current input box
            inputBox.value = '';

            // Create a new input box at a random position
            createInputBox();
        }
    });
}

// Create the first input box on page load
createInputBox();
