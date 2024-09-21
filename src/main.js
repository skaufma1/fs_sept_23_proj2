import {sendHttpGetRequest, sendHttpPostRequest } from '../http_client.js';

const numOfPrizesOnBoard = 15;

const playersNameScoreContainer = document.getElementById('playersNameScoreContainer');
const prizesStatsContainer = document.getElementById('prizesStatsContainer');
const playersInfoContainer = document.getElementById('playersInfoContainer');
const loginInputContainer = document.getElementById('loginInputContainer');
const audioControlDiv = document.getElementById('audioControlDiv');
const statsPanelSound = document.getElementById('statsPanelSound');
const audioOn = document.getElementById('audioOn');
const audioOff = document.getElementById('audioOff');
const collisionSound = document.getElementById('collisionSound');
const scoreContainer = document.getElementById('scoreContainer');
const gameStartTune = document.getElementById('gameStartTune');
const prizeHitSound = document.getElementById('prizeHitSound');
const playerNameDiv = document.getElementById('playerNameDiv');
const scoreDisplay = document.getElementById('scoreDisplay');
const autoPlayBtn = document.getElementById('autoPlayBtn');
const endGameDiv = document.getElementById('endGameDiv');
const startGameImg = document.getElementById('startGame');
const endGameImg = document.getElementById('endGame');
const gameCanvas = document.getElementById('gameCanvas');
const ctx        = gameCanvas.getContext('2d');
const ctxWidth   = gameCanvas.width;
const ctxHeight  = gameCanvas.height;
const imgSnakeHead_up    = document.getElementById('snakeHead_up');
const imgSnakeHead_right = document.getElementById('snakeHead_right');
const imgSnakeHead_down  = document.getElementById('snakeHead_down');
const imgSnakeHead_left  = document.getElementById('snakeHead_left');
// For the prizes: their types
const strawberryImg = document.getElementById('strawberryImg');  // Type = 0
const diamondImg    = document.getElementById('diamondImg');     // Type = 1
const bitcoinImg    = document.getElementById('bitcoinImg');     // Type = 2
const dollarsImg    = document.getElementById('dollarsImg');     // Type = 3
const bananaImg     = document.getElementById('bananaImg');      // Type = 4
const ringImg       = document.getElementById('ringImg');        // Type = 5

const diamondCount    = document.getElementById('diamondCount');
const bananaCount     = document.getElementById('bananaCount');
const bitcoinCount    = document.getElementById('bitcoinCount');
const ringCount       = document.getElementById('ringCount');
const strawberryCount = document.getElementById('strawberryCount');
const dollarsCount    = document.getElementById('dollarsCount');

// Specs of each of the prizes types
class PrizeType {
    img;
    width;
    height;
    score;
    inc_len;
    count;

    constructor (img, width, height, score, inc_len, count) {
        this.img = img;
        this.width = width;
        this.height = height;
        this.score = score;
        this.inc_len = inc_len;
        this.count = count;
  }
}

// Specs of each of the allocated prize on the playground - with poiter to the type
class Prize {
    type;
    x;
    y;

    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
  }
}

let showStatsPanel = true;
let showInfoPanel  = false;
let showInfoPanel_1stTime = true;
let isLoginStep = true;
let isAudioOn      = true;
let gameInit       = false;
let gameStarted    = false;
let step        = 2;
let totalSteps  = 2;

let dir;        // values: U, R, D, L
let currDir;    // purpose: avoiding handling the same key repeated striking
let fromX;
let fromY;
let len;
let maxPrizeHeight;
let maxPrizeWidth;
let username = undefined;
let totalScore = 0;
let snakeBody  = [];
let prizesArr  = [];
let prizeTypArr = [];
let randomPrizeSelArr = [];

let addPrizeTyp;           // img, width, height, score, addition to snake, count
addPrizeTyp = new PrizeType(strawberryImg, 44, 65, 10, 10, 0);  
prizeTypArr.push(addPrizeTyp);
addPrizeTyp = new PrizeType(diamondImg,    50, 42, 20, 20, 0);
prizeTypArr.push(addPrizeTyp);
addPrizeTyp = new PrizeType(bitcoinImg,    60, 52, 50, 50, 0);
prizeTypArr.push(addPrizeTyp);
addPrizeTyp = new PrizeType(dollarsImg,    80, 54, 40, 40, 0);
prizeTypArr.push(addPrizeTyp);
addPrizeTyp = new PrizeType(bananaImg,     75, 41, 15, 10, 0);
prizeTypArr.push(addPrizeTyp);
addPrizeTyp = new PrizeType(ringImg,       60, 60, 40, 40, 0);
prizeTypArr.push(addPrizeTyp);

// Array to support a random selection of a new Prize to render
let j = 0;
for (let i = 0; i <= 99; i++) {
    randomPrizeSelArr.push(j++);

    if (j > prizeTypArr.length -1) j = 0;
}

// For Prizes auto-placement allocation on the Canvas
maxPrizeHeight = 0;
maxPrizeWidth = 0;
for (let i = 0; i < prizeTypArr.length; i++) {
    if (prizeTypArr[i].height > maxPrizeHeight) maxPrizeHeight = prizeTypArr[i].height;
    if (prizeTypArr[i].width  > maxPrizeWidth)  maxPrizeWidth  = prizeTypArr[i].width;
}

// Set the background color
ctx.fillStyle = 'lightblue'; // Change 'lightblue' to your desired color
ctx.fillRect(0, 0, ctxWidth, ctxHeight);

/********************************
 * Function: preGameInfo
 ********************************/
function preGameInfo() {
    window.open('info.html', '_blank');
    
    gameStartTune.play();
    gameStartTune.loop = true;

    if (isAudioOn)
        gameStartTune.volume = 0.3;
    else
        gameStartTune.volume = 0;
}

/********************************
 * Function: showStartGameMsg
 ********************************/
function showStartGameMsg() {
    startGameImg.style.display = 'inline';
}

// Controlling Audio ON / OFF
audioControlDiv.onclick = ()=> {

    if (!isAudioOn) {
        audioOff.style.display = 'none';
        audioOn.style.display  = 'inline';

        document.querySelectorAll('audio').forEach(audio => {
            audio.volume = 0.3;
        });
    } else {
        audioOn.style.display  = 'none';
        audioOff.style.display = 'inline';

        document.querySelectorAll('audio').forEach(audio => {
            audio.volume = 0;
        });
    }

    isAudioOn = !isAudioOn;
}

document.body.onkeyup = (eV)=>{
    controller(eV);
}

/********************************
 * Function: controller(eV)
 * Purpose: Main Logic Control
 ********************************/
function controller(eV){

    if (isLoginStep) return;

    switch(eV.keyCode){
        case 32: //space bar
            console.log("Spacebar pressed");

            if (!gameInit) {
                preGameInfo();
            
                gameInit = !gameInit;
            } else if (!gameStarted) {
                playerNameDiv.style.display = "none";
                initGame();
                startGame();

                gameStarted = !gameStarted;
            }
            break;
        case 37: //left
            console.log("Left pressed");
            dir = 'L';
            break;
        case 38: //up
            console.log("Up pressed");
            dir = 'U';
            break;
        case 39: //right
            console.log("Right pressed");
            dir = 'R';
            break;
        case 40: //down
            console.log("Down pressed");
            dir = 'D';
            break;
        case 73: // CTRL+ i key, for controlling stats panel display
            if (eV.ctrlKey) {
                if (!showStatsPanel)
                    prizesStatsContainer.style.display = 'inline';
                else
                    prizesStatsContainer.style.display = 'none';
              
                showStatsPanel = !showStatsPanel; 

                if (isAudioOn)
                    statsPanelSound.play();
            }         
            break;
        case 77: // CTRL+ m key, for controlling players scores panel display
            if (eV.ctrlKey) {
                if (!showInfoPanel)
                    playersInfoContainer.style.display = 'inline';
                else
                    playersInfoContainer.style.display = 'none';
              
                showInfoPanel = !showInfoPanel; 

                if (isAudioOn)
                    statsPanelSound.play();
            }         
            break;
        default:
            break;
    }

    if ((eV.keyCode != 32) && validDirChange(dir, currDir)) {   // Only for U, R, D, L moves
        fromX = snakeBody[0].toX;
        fromY = snakeBody[0].toY;
        
        len = 0;
        snakeBody.unshift({'fromX':fromX, 'fromY':fromY, 'toX':null, 'toY':null, 'len':len, 'dir':dir});

        currDir = dir;
   }
}


/**************************************************************
 * Function: validDirChange(new Direction, currect Direction)
 * Purpose: Verifying new vs. curr directions are ligitimate
 **************************************************************/
function validDirChange(newDir, currDir) {
    if (newDir == currDir)
        return false;

    if (((newDir == 'U') && (currDir == 'D')) || ((newDir == 'D') && (currDir == 'U')))
        return false;

    if (((newDir == 'L') && (currDir == 'R')) || ((newDir == 'R') && (currDir == 'L')))
        return false;

    return true;
}

/**************************************************************
 * Function: colorSnakeBodyAtSelfCollision
 * Purpose: In case Snake collides with itself -
 *          color its body in red
 **************************************************************/
function colorSnakeBodyAtSelfCollision() {

    let toX = 0;
    let toY = 0;

    for (let i = 3; i< snakeBody.length; i++) {

        // Begin drawing path  
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.setLineDash([10, 3, 2, 3]);  // [dash length, gap length, smaller dash length, gap length]
        ctx.moveTo(snakeBody[i].fromX, snakeBody[i].fromY);

        switch (snakeBody[i].dir) {
            case 'U':
                ctx.lineTo(snakeBody[i].fromX, snakeBody[i].fromY - snakeBody[i].len);
                break;
            case 'R':
                ctx.lineTo(snakeBody[i].fromX + snakeBody[i].len, snakeBody[i].fromY);
                break;
            case 'D':
                ctx.lineTo(snakeBody[i].fromX, snakeBody[i].fromY + snakeBody[i].len);
                break;
            case 'L':
                ctx.lineTo(snakeBody[i].fromX - snakeBody[i].len, snakeBody[i].fromY);
                break;
        }

    ctx.stroke();
    }
}

/*******************************************************************
 * Function: isSnakeBodyCollision
 * @returns boolean: TRUE in case Snake has collided with itself
 *******************************************************************/
function isSnakeBodyCollision() {
    let isCollision = false;
    let snakeHeadX  = 0;
    let snakeHeadY  = 0;

    if (snakeBody.length <= 3) 
        return false;

    switch (snakeBody[0].dir) {
        case 'U':     
            snakeHeadX = snakeBody[0].toX;
            snakeHeadY = snakeBody[0].toY - 30;
            break;
        case 'R':
            snakeHeadX = snakeBody[0].toX + 30;
            snakeHeadY = snakeBody[0].toY;
            break;
        case 'D':
            snakeHeadX = snakeBody[0].toX;
            snakeHeadY = snakeBody[0].toY + 30;
            break;
        case 'L':
            snakeHeadX = snakeBody[0].toX - 30;
            snakeHeadY = snakeBody[0].toY;          
            break;
    }

    for (let i = 3; i < snakeBody.length; i++) {
    
      switch (snakeBody[0].dir) {
          case 'U':     
              if (isBetween(snakeBody[i].fromY, snakeHeadY, snakeBody[0].fromY) && isBetween(snakeHeadX, snakeBody[i].fromX, snakeBody[i].toX)) {
                  isCollision = true;
                  break;
              }
              break;
          case 'R':
              if (isBetween(snakeBody[i].fromX, snakeHeadX, snakeBody[0].fromX) && isBetween(snakeHeadY, snakeBody[i].fromY, snakeBody[i].toY)) {
                  isCollision = true;
                  console.log("TRUE");
                  break;           
              }
              break;
          case 'D':
              if (isBetween(snakeBody[i].fromY, snakeHeadY, snakeBody[0].fromY) && isBetween(snakeHeadX, snakeBody[i].fromX, snakeBody[i].toX)) {
                  isCollision = true;
                  break;
              }
              break;
          case 'L':
              if (isBetween(snakeBody[i].fromX, snakeHeadX, snakeBody[0].fromX) && isBetween(snakeHeadY, snakeBody[i].fromY, snakeBody[i].toY)) {
                isCollision = true;
                break;
              }
              break;
        }
    }

    if (isCollision) {
        colorSnakeBodyAtSelfCollision();
        
        return true;
    }

    return false;
}

/*****************************************************************
 * Function: isBetween
 * @param n  :number
 * @param n1 :number
 * @param n2 :number
 * @returns boolean: TRUE if n >= Min(n1,n2) and n <= Max(n1,n2)
 *****************************************************************/
function isBetween(n, n1, n2) {
    return (n >= Math.min(n1, n2) && n <= Math.max(n1, n2));
}

/***************************************************************************************
 * Function: isBorderCollision
 * @returns boolean: TRUE in case the Snake collides with any of the 4x canvas borders
 ***************************************************************************************/
function isBorderCollision() {
    let isCollision = false;

    switch (snakeBody[0].dir) {
        case 'U':     
            if (snakeBody[0].toY <= 30)            isCollision = true;
            break;
        case 'R':
            if (snakeBody[0].toX >= ctxWidth -30)  isCollision = true;  
            break;
        case 'D':
            if (snakeBody[0].toY >= ctxHeight -30) isCollision = true;
            break;
        case 'L':
            if (snakeBody[0].toX <= 30)            isCollision = true;             
            break;
    }

    if (isCollision) {
        gameCanvas.style.border = '5px solid red';
        return true;
    }

    return false;
}

/*************************************************************
 * Function: initGame
 * Purpose: initialization before each game start / restart
 *************************************************************/
function initGame() {

    totalScore = 0;
    
    if (!showStatsPanel)
        prizesStatsContainer.style.display = 'none';
    else
        prizesStatsContainer.style.display = 'inline';

    if (!showInfoPanel)
        playersInfoContainer.style.display = 'none';
    else
        playersInfoContainer.style.display = 'inline';

    scoreContainer.style.display = 'inline';
  
    startGameImg.style.display = 'none';
    endGameImg.style.display = 'none';
    gameCanvas.style.border = '5px solid rgb(94, 136, 72)';
    
    while (snakeBody.length > 0) snakeBody.pop();
    while (prizesArr.length > 0) prizesArr.pop();

    for (let i = 0; i < prizeTypArr.length; i++)
        prizeTypArr[i].count = 0;

    fromX = ctxWidth /2;
    fromY = ctxHeight;

    len = 200;
    dir = 'U';      // Default is moving up
    currDir = dir;  

    snakeBody.push({'fromX':fromX, 'fromY':fromY, 'toX':null, 'toY':null, 'len':len, 'dir':dir});
}

/**************************************************
 * Function: prizesRender
 * Purpose: Allicated the prizes on the gameboard
 **************************************************/
function prizesRender() {

    while (prizesArr.length < numOfPrizesOnBoard) {
        let addPrize;
        let randomX  = 0;
        let randomY  = 0;
        let overlappingPrize    = true;
        let overlappingInPrizes = false;

        randomX = Math.floor(Math.random() * (ctxWidth - maxPrizeWidth));
        randomY = Math.floor(Math.random() * (ctxHeight - maxPrizeHeight));

        addPrize = new Prize(randomPrizeSelArr[Math.floor(Math.random() *100)], randomX, randomY);
        prizesArr.push(addPrize);
    }   

    for (let i = 0; i < prizesArr.length; i++) { //let prize of prizesArr) {    
        ctx.drawImage(prizeTypArr[prizesArr[i].type].img, prizesArr[i].x, prizesArr[i].y);
    }
}

/***************************************************************************************
 * Function: collectPrizeScore
 * Purpose: 1. Check if the Snake has collided with any of the prizes
 *             allocated on the gameboard
 *          2. At confirmed collision - collect the prize and lenghten the Snake body
 ***************************************************************************************/
function collectPrizeScore() {
    let index            = 0;
    let snakeHeadX       = 0;
    let snakeHeadY       = 0;
    let isPrizeCollision = false;

    switch (snakeBody[0].dir) {
      case 'U':     
          snakeHeadX = snakeBody[0].toX;
          snakeHeadY = snakeBody[0].toY - 30;
          break;
      case 'R':
          snakeHeadX = snakeBody[0].toX + 30;
          snakeHeadY = snakeBody[0].toY;
          break;
      case 'D':
          snakeHeadX = snakeBody[0].toX;
          snakeHeadY = snakeBody[0].toY + 30;
          break;
      case 'L':
          snakeHeadX = snakeBody[0].toX - 30;
          snakeHeadY = snakeBody[0].toY;          
          break;
    }

    for (let i = 0; i < prizesArr.length; i++) {

        switch (snakeBody[0].dir) {
            case 'U':     
                if (isBetween(prizesArr[i].y + prizeTypArr[prizesArr[i].type].height, snakeHeadY, snakeBody[0].fromY) && isBetween(snakeHeadX, prizesArr[i].x, prizesArr[i].x + prizeTypArr[prizesArr[i].type].width)) {
                    isPrizeCollision = true;
                    index = i;
                    break;
                    }
                break;
            case 'R':
                if (isBetween(prizesArr[i].x, snakeHeadX, snakeBody[0].fromX) && isBetween(snakeHeadY, prizesArr[i].y, prizesArr[i].y + prizeTypArr[prizesArr[i].type].height)) {
                    isPrizeCollision = true;
                    index = i;
                    break;           
                    }
                break;
            case 'D':
                if (isBetween(prizesArr[i].y, snakeHeadY, snakeBody[0].fromY) && isBetween(snakeHeadX, prizesArr[i].x, prizesArr[i].x + prizeTypArr[prizesArr[i].type].width)) {
                    isPrizeCollision = true;
                    index = i;
                    break;
                    }
                break;
            case 'L':
                if (isBetween(prizesArr[i].x + prizeTypArr[prizesArr[i].type].width, snakeHeadX, snakeBody[0].fromX) && isBetween(snakeHeadY, prizesArr[i].y, prizesArr[i].y + prizeTypArr[prizesArr[i].type].height)) {
                    isPrizeCollision = true;
                    index = i;
                    break;
                    }
                break;
        }
    }

    if (isPrizeCollision) {
        // Adding to the total score the current prize score + maintain counting of prizes/type
        totalScore += prizeTypArr[prizesArr[index].type].score;
        prizeTypArr[prizesArr[index].type].count++;

        // Update to DB the new Total Score for the user / player
        // sendHttpPostRequest('api/send_message?username='+username+'&score='+totalScore, (res)=>{
        // sendHttpPostRequest('api/update_user?username='+username, (res)=>{
        sendHttpPostRequest('api/update_user', (res)=>{
            console.log(res);
            if(res == "ok"){
                console.log("Res is ok. totalScore = ", totalScore);
            }
        }, JSON.stringify({"username":username, "score":totalScore}), (err)=>{
            console.log(err);
        });

        // Get all Users + their Highest Scores to be presented on the screen
        sendHttpGetRequest('api/get_users', (res)=>{
            let allUsersScores = JSON.parse(res);
            console.log(allUsersScores);
            
            for(let i=0;i<allUsersScores.length;i++){
                console.log(allUsersScores[i].username, ", ", allUsersScores[i].highest_score, ", ", allUsersScores[i].highest_score_date);
                
            }

            if (showInfoPanel_1stTime) {
                showInfoPanel_1stTime = false;
                showInfoPanel = true;

                playersInfoContainer.style.display = 'inline';
            }

            // playersInfoContainer.scrollTop = 0;
            playersNameScoreContainer.scrollTop = 0;
            
            // Empty the Score panel before re-building it
            while (playersInfoContainer.firstChild)
                playersInfoContainer.removeChild(playersInfoContainer.firstChild);

            while (playersNameScoreContainer.firstChild)
                playersNameScoreContainer.removeChild(playersNameScoreContainer.firstChild);

            const playerHeaderDiv = document.createElement('div');
            const dividerBr = document.createElement('br');

            playerHeaderDiv.innerHTML = "Highest Scores";
            playerHeaderDiv.style.textAlign = "center";
            playerHeaderDiv.style.fontFamily = "Blackletter, Old English Text MT, Garamond, serif";
            playerHeaderDiv.style.backgroundColor = "transparent";
            playerHeaderDiv.style.fontSize = "15px";

            playersInfoContainer.appendChild(playerHeaderDiv);

            for (let i=0; i < allUsersScores.length; i++) {
                const playerNameDiv  = document.createElement('div');
                const playerScoreDiv = document.createElement('div');

                playerNameDiv.innerHTML = allUsersScores[i].username;
                playerNameDiv.style.fontFamily = "Arial, Helvetica, sans-serif";
                playerNameDiv.style.width = "51%";
                playerNameDiv.style.textAlign = "left";
                playerNameDiv.style.display = "inline-block";

                if (username == allUsersScores[i].username) {
                    playerNameDiv.style.backgroundColor = "yellow";
                    playerScoreDiv.style.backgroundColor = "yellow";
                }
                else {
                    playerNameDiv.style.backgroundColor = "transparent";
                    playerScoreDiv.style.backgroundColor = "transparent";
                }

                playerScoreDiv.innerHTML = allUsersScores[i].highest_score;
                playerScoreDiv.style.fontFamily = "Arial, Helvetica, sans-serif";
                playerScoreDiv.style.display = "inline-block";
                playerScoreDiv.style.width = "48%";
                playerScoreDiv.style.textAlign = "right";

                playersNameScoreContainer.appendChild(playerNameDiv);
                playersNameScoreContainer.appendChild(playerScoreDiv);
                playersNameScoreContainer.appendChild(dividerBr);
            }

            playersInfoContainer.appendChild(playersNameScoreContainer);

            const ctrlNDiv  = document.createElement('div');
            ctrlNDiv.innerHTML = "CTRL + m";
            ctrlNDiv.style.fontFamily = "Arial, Helvetica, sans-serif";
            ctrlNDiv.style.fontSize = "10px";
            ctrlNDiv.style.position = "absolute";
            ctrlNDiv.style.bottom = "0";
            ctrlNDiv.style.left = "50%";
            ctrlNDiv.style.transform = "translateX(-50%)";
            ctrlNDiv.style.display = "flex";
            ctrlNDiv.style.padding = "5px";
            ctrlNDiv.style.justifyContent = "center";  /* Horizontally center the text */
            ctrlNDiv.style.alignItems = "flex-end";    /* Vertically align the text at the bottom */
            playersInfoContainer.appendChild(ctrlNDiv);
        }, (err)=>{
            console.log("Error: Cannot Perform the Query + ", err);            
        });

        // Adding to the length of the snake (along with the won score)
        snakeBody[snakeBody.length -1].len += prizeTypArr[prizesArr[index].type].inc_len;
      
        switch (snakeBody[snakeBody.length -1].dir) {
            case 'U':  
                snakeBody[snakeBody.length -1].fromY += prizeTypArr[prizesArr[index].type].inc_len;
                break;
            case 'R':
                snakeBody[snakeBody.length -1].fromX -= prizeTypArr[prizesArr[index].type].inc_len;
                break;
            case 'D':
                snakeBody[snakeBody.length -1].fromY -= prizeTypArr[prizesArr[index].type].inc_len;
                break;
            case 'L':
                snakeBody[snakeBody.length -1].fromX += prizeTypArr[prizesArr[index].type].inc_len;
                break; 
        }

        if (isAudioOn)
            prizeHitSound.play();
        prizesArr.splice(index,1);
    }
}

/*********************************************************************
 * Function: startGame
 * Purpose: Maintain repeatedly the ongoing functionaly of the game
 *********************************************************************/
function startGame() {
    ctx.strokeStyle = 'rgb(94, 136, 72)';
    ctx.setLineDash([10, 3, 2, 3]);  // [dash length, gap length, smaller dash length, gap length]
    ctx.lineWidth = 8;

    ctx.clearRect(0, 0, ctxWidth, ctxHeight);
    ctx.fillStyle = 'lightblue'; 
    ctx.fillRect(0, 0, ctxWidth, ctxHeight);
  
    scoreDisplay.textContent = totalScore;

    strawberryCount.textContent = prizeTypArr[0].count;
    diamondCount.textContent    = prizeTypArr[1].count;
    bitcoinCount.textContent    = prizeTypArr[2].count;
    dollarsCount.textContent    = prizeTypArr[3].count;
    bananaCount.textContent     = prizeTypArr[4].count;
    ringCount.textContent       = prizeTypArr[5].count;
  
    for (let i = 0; i< snakeBody.length; i++) {

        if (i > 0 && (snakeBody[i].len == 0)) {     // if last part of the snake body not used anymore
            snakeBody.splice(i, 1);
        } else {
            // Begin drawing path  
            ctx.beginPath();
            ctx.moveTo(snakeBody[i].fromX, snakeBody[i].fromY);

            if (i > 0 && (i == snakeBody.length -1) && (snakeBody[i].len >= step))
                snakeBody[i].len -= step;

            if (i == 0 && (snakeBody.length > 1) && (snakeBody[snakeBody.length -1].len > 0))
                snakeBody[0].len += step;      

            switch (snakeBody[i].dir) {
                case 'U':
                    ctx.lineTo(snakeBody[i].fromX, snakeBody[i].fromY - snakeBody[i].len);
                    snakeBody[i].toX = snakeBody[i].fromX;
                    snakeBody[i].toY = snakeBody[i].fromY - snakeBody[i].len + 4;
                    break;
                case 'R':
                    ctx.lineTo(snakeBody[i].fromX + snakeBody[i].len, snakeBody[i].fromY);
                    snakeBody[i].toX = snakeBody[i].fromX + snakeBody[i].len - 4;
                    snakeBody[i].toY = snakeBody[i].fromY;
                    break;
                case 'D':
                    ctx.lineTo(snakeBody[i].fromX, snakeBody[i].fromY + snakeBody[i].len);
                    snakeBody[i].toX = snakeBody[i].fromX;
                    snakeBody[i].toY = snakeBody[i].fromY + snakeBody[i].len - 4;
                    break;
                case 'L':
                    ctx.lineTo(snakeBody[i].fromX - snakeBody[i].len, snakeBody[i].fromY);
                    snakeBody[i].toX = snakeBody[i].fromX - snakeBody[i].len + 4;
                    snakeBody[i].toY = snakeBody[i].fromY;
                    break;
            }
          
            ctx.stroke();

            if (i == 0) {
                switch (snakeBody[i].dir) {
                    case 'U':
                        ctx.drawImage(imgSnakeHead_up, snakeBody[i].toX -16, snakeBody[i].toY -30, 30, 30);
                        break;
                    case 'R':
                        ctx.drawImage(imgSnakeHead_right, snakeBody[i].toX, snakeBody[i].toY -15, 30, 30);
                        break;
                    case 'D':
                        ctx.drawImage(imgSnakeHead_down, snakeBody[i].toX -15, snakeBody[i].toY, 30, 30);
                        break;
                    case 'L':
                        ctx.drawImage(imgSnakeHead_left, snakeBody[i].toX -30, snakeBody[i].toY -15, 30, 30);
                        break;
                }
            }
          
            if (i == snakeBody.length -1) {
                switch (snakeBody[i].dir) {
                    case 'U':
                        snakeBody[i].fromY += (step * -1);
                        break;
                    case 'R':
                        snakeBody[i].fromX += (step * 1);
                        break;
                    case 'D':
                        snakeBody[i].fromY += (step * 1);
                        break;
                    case 'L':
                        snakeBody[i].fromX += (step * -1);
                        break;
                }   
            }       
        }
    }
    
    if (!isBorderCollision() && !isSnakeBodyCollision()) {
        collectPrizeScore();
        prizesRender();

        setTimeout(startGame, 20);
    }
    else {
        prizesRender();

        if (isAudioOn) {
            collisionSound.play();
            collisionSound.volume = 0.3;
        }

        endGameImg.style.display = 'inline';
        gameStarted = false;
    }
}

/*********************************************************************
 * Function: containSpaces
 * Purpose: Returns true if an input string includes spaces
 *********************************************************************/
function containSpaces(str) {
    return /\s/.test(str);
}

/*********************************************************************
 * Function: login
 * Purpose: Requesting the player to fill in a unique
 *          first name / nickname
 *********************************************************************/
function login() {

    const loginInput = document.createElement('input');
    const loginBtn = document.createElement('button');

    loginInput.setAttribute('type', 'text');
    loginInput.setAttribute('placeholder', 'Enter first name / nickname');
    loginInput.setAttribute('pattern', '[^ ]*');
    loginInput.setAttribute('title', 'No spaces allowed');

    loginInput.style.backgroundImage ="url(media/yellow_background.jpg)";
    loginInput.maxLength = "8";
    loginInput.style.margin = '20px';
    loginInput.style.marginLeft = '5%';
    loginInput.style.fontSize = '35px';
    loginInput.s

    loginBtn.textContent = 'Login';
    loginBtn.style.marginLeft = '3%';
    loginBtn.style.fontSize = '35px';
    loginBtn.style.cursor = 'pointer';
    
    loginInputContainer.appendChild(loginInput);
    loginInputContainer.appendChild(loginBtn);

    const errText = document.createElement('span');
    errText.innerText = "";
    errText.style.color = "red";
    errText.style.fontSize = "25px";
    errText.style.bottom = "1px";
    errText.style.left = "30px";
    errText.style.marginLeft = "50px";
    errText.style.position = "absolute";
    errText.style.zIndex = "1000";
    loginInputContainer.appendChild(errText);

    loginInput.focus();
    loginBtn.disabled = true;

    loginInput.onclick = ()=>{
        errText.innerText = "";
    }

    loginInput.onchange = ()=>{
        if (containSpaces(loginInput.value)){
            errText.innerText = "Spaces not allowed";
            loginInput.value = "";
            loginInput.focus();
        } else {
        loginBtn.disabled = false;
        loginBtn.focus();
        }
    }
    loginInput.oninput = ()=>{
        errText.innerText = "";
    }

    loginBtn.onkeydown = (eV)=>{
        if (eV.key == 'Enter'){
            console.log("Yes");
            
            eV.preventDefault();
            loginBtn.click();
        }
    }
    loginBtn.onclick = ()=>{
        
        username = loginInput.value;

        // Update to DB the new Total Score for the user / player
        // sendHttpPostRequest('api/send_message?username='+username+'&score='+totalScore, (res)=>{
        sendHttpPostRequest('api/add_user', (res)=>{
            console.log(res);
            if(res == "ok"){               
                playerNameDiv.innerText= "\uD83D\uDCA5 Welcome " + username + " \uD83D\uDCA5";
            }
        }, JSON.stringify(loginInput.value), (err)=>{
            playerNameDiv.innerText= "\uD83D\uDCA5 Welcome back " + username + "\uD83D\uDCA5";
        });
        
        playerNameDiv.style.display = "inline-block"; 

        loginInput.style.display = "none";
        loginBtn.style.display = "none";
        loginInputContainer.style.display = "none";

        isLoginStep = false;
    }
}


login();
showStartGameMsg();
