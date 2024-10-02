import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, off, onValue, update, set, push, onChildAdded, onChildChanged, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

let myObjectsByFirebaseKey = {};
let canvas;
let inputBox;
let db;
let existingSubscribedFolder = null;
let selectedImageKey = null; // Records the selected image

const url = "https://replicate-api-proxy.glitch.me/create_n_get/";
let exampleName = "SharedMindsExample";

initFirebaseDB();
initHTML();
subscribeToData();
animate();

function animate() {
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let key in myObjectsByFirebaseKey) {
        let thisObject = myObjectsByFirebaseKey[key];

        if (thisObject.type === "image") {
            // Random movement for non-selected images
            if (selectedImageKey !== key) {
                thisObject.position.x += (Math.random() - 0.5) * 2;
                thisObject.position.y += (Math.random() - 0.5) * 2;

                // Constrain position within canvas
                thisObject.position.x = Math.max(0, Math.min(canvas.width - 256, thisObject.position.x));
                thisObject.position.y = Math.max(0, Math.min(canvas.height - 256, thisObject.position.y));
            }

            let position = thisObject.position;
            let img = thisObject.loadedImage;
            if (img) {
                ctx.fillStyle = "white";
                ctx.font = "30px Arial";
                ctx.fillText(thisObject.prompt, position.x, position.y - 30);
                ctx.drawImage(img, position.x, position.y, 256, 256);
            }
        } else if (thisObject.type === "text") {
            let position = thisObject.position;
            ctx.font = "30px Arial";
            ctx.fillText(thisObject.text, position.x, position.y);
        }
    }

    // Draw enlarged image on top layer
    if (selectedImageKey) {
        const selectedImageObject = myObjectsByFirebaseKey[selectedImageKey];
        if (selectedImageObject && selectedImageObject.loadedImage) {
            const img = selectedImageObject.loadedImage;
            const position = selectedImageObject.position;
            ctx.drawImage(img, position.x - (256 * 0.5), position.y - (256 * 0.5), 256 * 1.5, 256 * 1.5); // Enlarge 1.5x
        }
    }

    requestAnimationFrame(animate);
}

function clearLocalScene() {
    myObjectsByFirebaseKey = {};
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function askPictures(prompt, location) {
    document.body.style.cursor = "progress";
    const data = {
        version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
        input: {
            prompt: prompt,
        },
    };
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: 'application/json',
        },
        body: JSON.stringify(data),
    };

    const picture_info = await fetch(url, options);
    const proxy_said = await picture_info.json();

    if (proxy_said.output.length === 0) {
        console.log("Something went wrong, try it again");
    } else {
        addImageRemote(proxy_said.output[0], prompt, location);
    }
    document.body.style.cursor = "auto";
}

export function addTextRemote(text, pos) {
    let title = document.getElementById("title").value;
    const data = { type: "text", position: { x: pos.x, y: pos.y }, text: text };
    let folder = exampleName + "/" + title;
    addNewThingToFirebase(folder, data);
}

export function addImageRemote(imgURL, prompt, pos) {
    let title = document.getElementById("title").value;
    pos = {
        x: Math.random() * (canvas.width - 256),
        y: Math.random() * (canvas.height - 256),
    };

    const data = { type: "image", prompt: prompt, position: pos, imageURL: imgURL };
    let folder = exampleName + "/" + title;
    addNewThingToFirebase(folder, data);
}

// Initialize Firebase Database
function initFirebaseDB() {
    const firebaseConfig = {
        apiKey: "AIzaSyBRA7oN1C9Cm0CKCVys0WUzl_7umMIYdiA",
        authDomain: "shared-mind.firebaseapp.com",
        databaseURL: "https://shared-mind-default-rtdb.firebaseio.com",
        projectId: "shared-mind",
        storageBucket: "shared-mind.appspot.com",
        messagingSenderId: "1050804828540",
        appId: "1:1050804828540:web:b88433b3bf02b9361c4cf9",
        measurementId: "G-YJC9GF5V87"
    };
    const app = initializeApp(firebaseConfig);
    db = getDatabase();
}

function addNewThingToFirebase(folder, data) {
    const dbRef = ref(db, folder);
    push(dbRef, data);
}

// Subscribe to data from Firebase
function subscribeToData() {
    clearLocalScene();
    let title = document.getElementById("title").value;
    let folder = exampleName + "/" + title;
    if (existingSubscribedFolder) {
        const oldRef = ref(db, existingSubscribedFolder);
        off(oldRef);
    }
    existingSubscribedFolder = folder;

    const thisRef = ref(db, folder);
    onChildAdded(thisRef, (snapshot) => {
        let key = snapshot.key;
        let data = snapshot.val();
        myObjectsByFirebaseKey[key] = data;

        if (data.type === "image") {
            let img = new Image();
            img.onload = function () {
                img.setAttribute("id", key + "_image");
                myObjectsByFirebaseKey[key].loadedImage = img;

                // Add event listener to the image after it is loaded
                img.addEventListener("click", () => {
                    handleImageClick(key);
                });
            }
            img.src = data.imageURL;
        }
    });

    onChildChanged(thisRef, (data) => {
        let key = data.key;
        let thisObject = myObjectsByFirebaseKey[key];
        if (thisObject) {
            thisObject.text = data.val().text;
            thisObject.position = data.val().position;
            thisObject.size = data.val().size; 
        }
    });

    onChildRemoved(thisRef, (data) => {
        let key = data.key;
        delete myObjectsByFirebaseKey[key];
    });
}

function handleImageClick(key) {
    const thisObject = myObjectsByFirebaseKey[key];

    // If no size, set default size
    if (!thisObject.size) {
        thisObject.size = { width: 256, height: 256 }; // Default size
    }

    // Each click enlarges 1.5 times
    thisObject.size.width *= 1.5;
    thisObject.size.height *= 1.5;

    // Update database to save new size
    const updatedData = {
        ...thisObject,
        size: thisObject.size // Save new size
    };

    let title = document.getElementById("title").value;
    let folder = exampleName + "/" + title;
    update(ref(db, folder + '/' + key), updatedData);
}

// Initialize HTML interface
function initHTML() {
    canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'myCanvas');
    canvas.style.position = 'absolute';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    // Set pointer events to allow clicks
    canvas.style.pointerEvents = 'auto'; // Enable click events on canvas

    inputBox = document.createElement('input');
    inputBox.setAttribute('type', 'text');
    inputBox.setAttribute('id', 'inputBox');
    inputBox.setAttribute('placeholder', 'What do you think');
    inputBox.style.position = 'absolute';
    inputBox.style.left = '50%';
    inputBox.style.top = '50%';
    inputBox.style.transform = 'translate(-50%, -50%)';
    inputBox.style.fontSize = '30px';
    inputBox.style.fontFamily = 'Arial';
    document.body.appendChild(inputBox);
    inputBox.setAttribute('autocomplete', 'off');

    inputBox.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            const inputValue = inputBox.value;
            let inputBoxLocation = inputBox.getBoundingClientRect();
            let pos = { x: inputBoxLocation.left, y: inputBoxLocation.top };
            askPictures(inputValue, pos);
        }
    });

    const titleBox = document.createElement('input');
    titleBox.setAttribute('type', 'text');
    titleBox.setAttribute('id', 'title');
    titleBox.value = 'War and Peace';
    titleBox.style.position = 'absolute';
    titleBox.style.left = '50%';
    titleBox.style.top = '10%';
    titleBox.style.transform = 'translate(-50%, -50%)';
    titleBox.style.fontSize = '20px';
    titleBox.style.fontFamily = 'Arial';
    document.body.appendChild(titleBox);

    const titleLabel = document.createElement('label');
    titleLabel.setAttribute('for', 'title');
    titleLabel.textContent = 'Title:';
    titleLabel.style.position = 'absolute';
    titleLabel.style.left = '50%';
    titleLabel.style.top = '3%';
    titleLabel.style.transform = 'translate(-50%, -50%)';
    titleLabel.style.fontSize = '15px';
    titleLabel.style.fontFamily = 'Arial';
    document.body.appendChild(titleLabel);
}
