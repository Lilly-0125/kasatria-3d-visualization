import * as THREE from "three";

import {
    CSS3DRenderer,
    CSS3DObject
}
from "three/addons/renderers/CSS3DRenderer.js";

import {
    TrackballControls
}
from "three/addons/controls/TrackballControls.js";

import TWEEN
from "three/addons/libs/tween.module.js";



// =====================================
// GOOGLE CONFIGURATION
// =====================================

const CLIENT_ID =
    "828155451020-lkgrk1e52ebitnplfen9d7evng27n6v4.apps.googleusercontent.com";


const SPREADSHEET_ID =
    "1LYy0Za0ysFAwrJXet7TRgOyEo8WN-IxWO2CIHD7X428";


const SHEET_NAME =
    "Data Template";



// GOOGLE SHEETS PERMISSION
const SCOPES =
    "https://www.googleapis.com/auth/spreadsheets.readonly";



let tokenClient;


let camera;
let scene;
let renderer;
let controls;


const objects = [];


const targets = {

    table: [],

    sphere: [],

    helix: [],

    grid: []

};



// =====================================
// START GOOGLE LOGIN
// =====================================

window.addEventListener(
    "load",
    initializeGoogleLogin
);



function initializeGoogleLogin() {

    tokenClient =
        google.accounts.oauth2.initTokenClient({

            client_id: CLIENT_ID,

            scope: SCOPES,

            callback: handleAccessToken

        });


    document
        .getElementById("google-login-button")
        .addEventListener(
            "click",
            function () {

                document
                    .getElementById("login-status")
                    .textContent =
                    "Opening Google sign-in...";


                tokenClient.requestAccessToken({
                    prompt: "consent"
                });

            }
        );
}



// =====================================
// ACCESS TOKEN RECEIVED
// =====================================

async function handleAccessToken(tokenResponse) {

    if (tokenResponse.error) {

        console.error(
            "Google authorization error:",
            tokenResponse
        );

        document
            .getElementById("login-status")
            .textContent =
            "Google sign-in failed. Please try again.";

        return;
    }


    const accessToken =
        tokenResponse.access_token;


    console.log(
        "Google authorization successful"
    );


    document
        .getElementById("login-page")
        .style.display = "none";


    document
        .getElementById("visualization-page")
        .style.display = "block";


    try {

        const data =
            await loadGoogleSheet(
                accessToken
            );


        console.log(
            "Google Sheet data:",
            data
        );


        initVisualization(
            data
        );


        animate();

    }
    catch (error) {

        console.error(
            "Sheet error:",
            error
        );


        document
            .getElementById("loading")
            .textContent =
            "Failed to load Google Sheet";

    }
}



// =====================================
// LOAD GOOGLE SHEET
// =====================================

async function loadGoogleSheet(
    accessToken
) {


    const range =
        `${SHEET_NAME}!A1:F201`;



    const url =
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;



    const response =
        await fetch(
            url,
            {

                headers: {

                    Authorization:
                        `Bearer ${accessToken}`

                }

            }
        );



    if (
        !response.ok
    ) {


        const errorText =
            await response.text();


        throw new Error(
            errorText
        );

    }



    const result =
        await response.json();



    return rowsToObjects(
        result.values
    );

}



// =====================================
// GOOGLE ROWS -> JAVASCRIPT OBJECTS
// =====================================

function rowsToObjects(
    values
) {


    if (
        !values ||
        values.length < 2
    ) {


        throw new Error(
            "Google Sheet contains no data"
        );

    }



    const headers =
        values[0];



    return values
        .slice(1)
        .map(
            row => {


                const item = {};


                headers.forEach(
                    (
                        header,
                        index
                    ) => {


                        item[
                            header.trim()
                        ] =
                            row[index] ??
                            "";


                    }
                );


                return item;


            }
        );

}



// =====================================
// CREATE VISUALIZATION
// =====================================

function initVisualization(
    data
) {


    camera =
        new THREE
            .PerspectiveCamera(

                40,

                window.innerWidth /
                window.innerHeight,

                1,

                10000

            );


    camera.position.z =
        3000;



    scene =
        new THREE.Scene();



    // CREATE CARD FOR EVERY PERSON
    data.forEach(
        (
            person,
            index
        ) => {


            createPersonCard(
                person,
                index
            );


        }
    );



    createTable();

    createSphere();

    createHelix();

    createGrid();



    renderer =
        new CSS3DRenderer();


    renderer.setSize(

        window.innerWidth,

        window.innerHeight

    );



    document
        .getElementById(
            "container"
        )
        .appendChild(
            renderer.domElement
        );



    controls =
        new TrackballControls(

            camera,

            renderer.domElement

        );


    controls.minDistance =
        500;


    controls.maxDistance =
        8000;


    controls
        .addEventListener(

            "change",

            render

        );



    setupButtons();



    document
        .getElementById(
            "loading"
        )
        .style.display =
        "none";



    transform(
        targets.table,
        2000
    );



    window
        .addEventListener(

            "resize",

            onWindowResize

        );

}



// =====================================
// CREATE REAL PERSON CARD
// =====================================

function createPersonCard(
    person,
    index
) {


    const element =
        document.createElement(
            "div"
        );


    element.className =
        "element";



    // NET WORTH COLOR
    const netWorth =
        parseNetWorth(
            person["Net Worth"]
        );


    if (
        netWorth > 200000
    ) {


        element.classList.add(
            "net-green"
        );


    }
    else if (
        netWorth >= 100000
    ) {


        element.classList.add(
            "net-orange"
        );


    }
    else {


        element.classList.add(
            "net-red"
        );


    }



    // NUMBER
    const number =
        document.createElement(
            "div"
        );


    number.className =
        "number";


    number.textContent =
        index + 1;


    element.appendChild(
        number
    );



    // PHOTO
    const photo =
        document.createElement(
            "img"
        );


    photo.className =
        "photo";


    photo.src =
        person.Photo;


    photo.alt =
        person.Name;


    element.appendChild(
        photo
    );



    // NAME
    const name =
        document.createElement(
            "div"
        );


    name.className =
        "name";


    name.textContent =
        person.Name;


    element.appendChild(
        name
    );



    // AGE
    const age =
        document.createElement(
            "div"
        );


    age.className =
        "info";


    age.textContent =
        `Age: ${person.Age}`;


    element.appendChild(
        age
    );



    // COUNTRY
    const country =
        document.createElement(
            "div"
        );


    country.className =
        "info";


    country.textContent =
        `${person.Country} | ${person.Interest}`;


    element.appendChild(
        country
    );



    // NET WORTH
    const worth =
        document.createElement(
            "div"
        );


    worth.className =
        "networth";


    worth.textContent =
        person["Net Worth"];


    element.appendChild(
        worth
    );



    const objectCSS =
        new CSS3DObject(
            element
        );



    objectCSS.position.x =
        Math.random() *
        4000 -
        2000;


    objectCSS.position.y =
        Math.random() *
        4000 -
        2000;


    objectCSS.position.z =
        Math.random() *
        4000 -
        2000;



    scene.add(
        objectCSS
    );


    objects.push(
        objectCSS
    );

}



// =====================================
// CONVERT NET WORTH TO NUMBER
// =====================================

function parseNetWorth(
    value
) {


    return Number(

        String(value)
            .replace(
                /[^0-9.-]+/g,
                ""
            )

    );

}



// =====================================
// TABLE 20 × 10
// =====================================

function createTable() {


    const columns =
        20;


    const horizontalSpacing =
        140;


    const verticalSpacing =
        175;



    for (
        let i = 0;
        i < objects.length;
        i++
    ) {


        const object =
            new THREE
                .Object3D();



        const column =
            i % columns;


        const row =
            Math.floor(
                i /
                columns
            );



        object.position.x =

            column *
            horizontalSpacing

            -

            (
                columns - 1
            )

            *

            horizontalSpacing /
            2;



        object.position.y =

            -(
                row *
                verticalSpacing
            )

            +

            (
                9 *
                verticalSpacing /
                2
            );



        object.position.z =
            0;



        targets.table.push(
            object
        );

    }

}



// =====================================
// SPHERE
// =====================================

function createSphere() {


    const vector =
        new THREE
            .Vector3();



    for (
        let i = 0;
        i < objects.length;
        i++
    ) {


        const phi =

            Math.acos(

                -1 +

                (
                    2 *
                    i
                )

                /

                objects.length

            );



        const theta =

            Math.sqrt(

                objects.length *
                Math.PI

            )

            *

            phi;



        const object =
            new THREE
                .Object3D();



        object.position
            .setFromSphericalCoords(

                900,

                phi,

                theta

            );



        vector
            .copy(
                object.position
            )
            .multiplyScalar(
                2
            );



        object.lookAt(
            vector
        );



        targets.sphere.push(
            object
        );

    }

}



// =====================================
// DOUBLE HELIX
// =====================================

function createHelix() {


    const vector =
        new THREE
            .Vector3();


    const radius =
        900;



    for (
        let i = 0;
        i < objects.length;
        i++
    ) {


        const object =
            new THREE
                .Object3D();



        const strand =
            i % 2;



        const index =
            Math.floor(
                i / 2
            );



        const theta =

            index *
            0.35

            +

            strand *
            Math.PI;



        object.position.x =

            radius *
            Math.sin(
                theta
            );



        object.position.y =

            900

            -

            index *
            18;



        object.position.z =

            radius *
            Math.cos(
                theta
            );



        vector.set(

            object.position.x *
            2,

            object.position.y,

            object.position.z *
            2

        );



        object.lookAt(
            vector
        );



        targets.helix.push(
            object
        );

    }

}



// =====================================
// GRID 5 × 4 × 10
// =====================================

function createGrid() {


    for (
        let i = 0;
        i < objects.length;
        i++
    ) {


        const object =
            new THREE
                .Object3D();



        const x =
            i % 5;



        const y =

            Math.floor(
                i / 5
            )

            %

            4;



        const z =

            Math.floor(
                i / 20
            );



        object.position.x =

            x *
            400

            -

            800;



        object.position.y =

            600

            -

            y *
            400;



        object.position.z =

            z *
            600

            -

            2700;



        targets.grid.push(
            object
        );

    }

}



// =====================================
// BUTTONS
// =====================================

function setupButtons() {


    document
        .getElementById(
            "table"
        )
        .addEventListener(
            "click",
            function () {


                resetCamera(
                    3000
                );


                transform(
                    targets.table,
                    2000
                );

            }
        );



    document
        .getElementById(
            "sphere"
        )
        .addEventListener(
            "click",
            function () {


                resetCamera(
                    3000
                );


                transform(
                    targets.sphere,
                    2000
                );

            }
        );



    document
        .getElementById(
            "helix"
        )
        .addEventListener(
            "click",
            function () {


                resetCamera(
                    3500
                );


                transform(
                    targets.helix,
                    2000
                );

            }
        );



    document
        .getElementById(
            "grid"
        )
        .addEventListener(
            "click",
            function () {


                resetCamera(
                    6000
                );


                transform(
                    targets.grid,
                    2000
                );

            }
        );

}



// =====================================
// RESET CAMERA
// =====================================

function resetCamera(
    distance
) {


    camera.position.set(

        0,

        0,

        distance

    );


    camera.up.set(

        0,

        1,

        0

    );


    camera.lookAt(

        0,

        0,

        0

    );


    controls.target.set(

        0,

        0,

        0

    );


    controls.update();

}



// =====================================
// TRANSFORM
// =====================================

function transform(
    targetArray,
    duration
) {


    TWEEN.removeAll();



    for (
        let i = 0;
        i < objects.length;
        i++
    ) {


        const object =
            objects[i];


        const target =
            targetArray[i];



        new TWEEN.Tween(
            object.position
        )

            .to(

                {

                    x:
                        target.position.x,

                    y:
                        target.position.y,

                    z:
                        target.position.z

                },

                Math.random() *
                duration +
                duration

            )

            .easing(

                TWEEN
                    .Easing
                    .Exponential
                    .InOut

            )

            .start();



        new TWEEN.Tween(
            object.rotation
        )

            .to(

                {

                    x:
                        target.rotation.x,

                    y:
                        target.rotation.y,

                    z:
                        target.rotation.z

                },

                Math.random() *
                duration +
                duration

            )

            .easing(

                TWEEN
                    .Easing
                    .Exponential
                    .InOut

            )

            .start();

    }



    new TWEEN.Tween({})

        .to(
            {},
            duration * 2
        )

        .onUpdate(
            render
        )

        .start();

}



// =====================================
// WINDOW RESIZE
// =====================================

function onWindowResize() {


    camera.aspect =

        window.innerWidth

        /

        window.innerHeight;



    camera
        .updateProjectionMatrix();



    renderer.setSize(

        window.innerWidth,

        window.innerHeight

    );



    render();

}



// =====================================
// ANIMATION
// =====================================

function animate(
    time
) {


    requestAnimationFrame(
        animate
    );


    TWEEN.update(
        time
    );


    if (
        controls
    ) {

        controls.update();

    }

}



// =====================================
// RENDER
// =====================================

function render() {


    renderer.render(

        scene,

        camera

    );

}