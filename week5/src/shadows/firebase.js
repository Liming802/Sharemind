import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";
import { getAuth, signOut, setPersistence, browserSessionPersistence, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";


const subtitles = document.querySelectorAll('.subtitle');
let currentIndex = 0;
const duration = 15000; // 15 seconds


let db, auth, app;
let googleAuthProvider;

initFirebase();




function initFirebase() {
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

    // Initialize Firebase app
    app = initializeApp(firebaseConfig);

    // Initialize Firebase Authentication
    auth = getAuth(app);
    // Initialize Firebase Realtime Database
    db = getDatabase(app);

    // Set session persistence for auth
    setPersistence(auth, browserSessionPersistence);

    // Set up Google Authentication Provider
    googleAuthProvider = new GoogleAuthProvider();
}

// Handle auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in", user);
        showLogOutButton(user);
        updateContentForUser(user); // Update content for logged-in user
    } else {
        console.log("User is signed out");
        showLoginButton();
        resetContent(); // Reset content for logged-out users
    }
});

// Create the auth container div and append it to the DOM
let authDiv = document.createElement("div");
authDiv.style.position = "absolute";
authDiv.style.top = "50%";
authDiv.style.left = "85%";
authDiv.style.width = "150px";
authDiv.style.backgroundColor = "white";
authDiv.style.border = "1px solid black";
authDiv.style.padding = "10px";
authDiv.style.zIndex = "3000";
document.body.appendChild(authDiv);

// Show logout button when user is logged in
function showLogOutButton(user) {
    authDiv.innerHTML = "";

    if (user.photoURL) {
        let userPic = document.createElement("img");
        userPic.src = user.photoURL;
        userPic.style.width = "50px";
        userPic.style.height = "50px";
        authDiv.appendChild(userPic);
    }

    let userNameDiv = document.createElement("div");
    userNameDiv.innerHTML = user.displayName ? user.displayName : user.email;
    authDiv.appendChild(userNameDiv);

    let logOutButton = document.createElement("button");
    logOutButton.innerHTML = "Log Out";
    logOutButton.setAttribute("id", "logOut");
    logOutButton.setAttribute("class", "authButton");
    authDiv.appendChild(logOutButton);

    document.getElementById("logOut").addEventListener("click", function () {
        signOut(auth).then(() => {
            console.log("Signed out successfully.");
            resetContent(); // Reset content on sign out
        }).catch((error) => {
            console.error("Error signing out:", error);
        });
    });
}

// Show only Google login button when user is logged out
function showLoginButton() {
    authDiv.innerHTML = "";

    let signUpWithGoogleButton = document.createElement("button");
    signUpWithGoogleButton.innerHTML = "Google Login";
    signUpWithGoogleButton.setAttribute("id", "signInWithGoogle");
    signUpWithGoogleButton.setAttribute("class", "authButton");
    authDiv.appendChild(signUpWithGoogleButton);

    document.getElementById("signInWithGoogle").addEventListener("click", function (event) {
        signInWithPopup(auth, googleAuthProvider)
            .then((result) => {
                console.log("Google sign-in successful:", result.user);
                updateContentForUser(result.user); // Update content after login
            }).catch((error) => {
                console.error("Error with Google sign-in:", error);
            });
        event.stopPropagation();
    });
}

// Dynamically update content for logged-in users
function updateContentForUser(user) {

    cofnsole.log(`Welcome, ${user.displayName || user.email}`);
}

// Reset content for logged-out users
function resetContent() {

    document.body.style.backgroundColor = "white"; // Example change for logged-out user
}

export { db };
