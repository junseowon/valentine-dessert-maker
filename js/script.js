
const DESSERT = [
    { label: 'chip', name: '초코칩', size: 15, score: 2, emoji: '🤎', color: '#f5ebe0' },
    { label: 'candy', name: '알사탕', size: 22, score: 4, emoji: '🍬', color: '#ffccd5' },
    { label: 'macaron', name: '마카롱', size: 30, score: 8, emoji: '🌰', color: '#ffb3c1' },
    { label: 'chocolate', name: '초콜릿', size: 40, score: 16, emoji: '🍫', color: '#e29578' },
    { label: 'lollipop', name: '막대사탕', size: 50, score: 32, emoji: '🍭', color: '#ff85a1' },
    { label: 'cookie', name: '쿠키', size: 60, score: 64, emoji: '🍪', color: '#d4a373' },
    { label: 'donut', name: '도넛', size: 72, score: 128, emoji: '🍩', color: '#ffc2d1' },
    { label: 'cupcake', name: '컵케이크', size: 85, score: 256, emoji: '🧁', color: '#ffe5ec' },
    { label: 'cake', name: '조각케이크', size: 100, score: 512, emoji: '🍰', color: '#ff7096' },
    { label: 'gift', name: '선물상자', size: 115, score: 1024, emoji: '💝', color: '#ff4d6d' },
    { label: 'heart', name: '대왕하트', size: 135, score: 2048, emoji: '💖', color: '#ff0054' }
];

let engine, render, runner, container;
let currentScore = 0;
let isGameOver = false;
let nextFruitIndex = 0;
let currentHoldingIndex = 0;
let isWaiting = false;
let holdingBody = null; 
const DEAD_LINE = 85;

const setup = () => {
    container = document.getElementById('game-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    engine = Matter.Engine.create();
    engine.world.gravity.y = 1.5; // 조금 더 묵직하게 중력 조정
    
    // 물리 계산
    engine.positionIterations = 20;
    engine.velocityIterations = 20;

    render = Matter.Render.create({
        element: container,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent'
        }
    });

    // 바닥(Ground)을 핑크색 선 위치에 정확히 맞춤
    // 바닥 두께를 200px로 하여 뚫림 방지
    const wallOptions = { isStatic: true, render: { fillStyle: 'transparent' }, label: 'wall', friction: 0.6 };
    const ground = Matter.Bodies.rectangle(width / 2, height + 100, width * 2, 200, wallOptions);
    const leftWall = Matter.Bodies.rectangle(-50, height / 2, 100, height * 2, wallOptions);
    const rightWall = Matter.Bodies.rectangle(width + 50, height / 2, 100, height * 2, wallOptions);
    
    Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

    runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    Matter.Events.on(engine, 'collisionStart', handleCollision);
    Matter.Events.on(engine, 'afterUpdate', checkGameOver);
    Matter.Events.on(render, 'afterRender', drawEmojis);

    const updateUI = (e) => {
        if (isGameOver || isWaiting || !holdingBody) return;
        const x = getX(e);
        const fruitData = DESSERT[currentHoldingIndex];
        const clampedX = Math.max(fruitData.size + 10, Math.min(width - fruitData.size - 10, x));
        
        Matter.Body.setPosition(holdingBody, { x: clampedX, y: 45 });
        document.getElementById('guide-line').style.left = clampedX + 'px';
        document.getElementById('guide-line').style.display = 'block';
    };

    container.addEventListener('mousemove', updateUI);
    container.addEventListener('mousedown', updateUI);
    window.addEventListener('mouseup', () => {
        if (isGameOver || isWaiting || !holdingBody) return;
        document.getElementById('guide-line').style.display = 'none';
        dropFruit();
    });

    container.addEventListener('touchstart', (e) => {
        e.preventDefault();
        updateUI(e.touches[0]);
    }, {passive: false});
    container.addEventListener('touchmove', (e) => {
        e.preventDefault();
        updateUI(e.touches[0]);
    }, {passive: false});
    container.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (isGameOver || isWaiting || !holdingBody) return;
        document.getElementById('guide-line').style.display = 'none';
        dropFruit();
    });

    currentHoldingIndex = Math.floor(Math.random() * 3);
    prepareNext();
    createGuideUI();
    createHoldingBody();
};

const createGuideUI = () => {
    const list = document.getElementById('guide-list');
    list.innerHTML = "";
    DESSERT.forEach((fruit, index) => {
        const item = document.createElement('div');
        item.className = 'guide-item';
        item.innerHTML = `<div class="guide-emoji">${fruit.emoji}</div><div class="guide-name">${fruit.name}</div>`;
        list.appendChild(item);
        if (index < DESSERT.length - 1) {
            const arrow = document.createElement('div');
            arrow.className = 'guide-arrow';
            arrow.innerText = '▼';
            list.appendChild(arrow);
        }
    });
};

const prepareNext = () => {
    nextFruitIndex = Math.floor(Math.random() * 3);
    document.getElementById('next-emoji').innerText = DESSERT[nextFruitIndex].emoji;
};

const createHoldingBody = () => {
    if (isGameOver) return;
    const fruitData = DESSERT[currentHoldingIndex];
    holdingBody = Matter.Bodies.circle(container.clientWidth / 2, 45, fruitData.size, {
        isStatic: true,
        isSensor: true,
        label: fruitData.label,
        index: currentHoldingIndex,
        render: { fillStyle: fruitData.color, strokeStyle: '#ffffff', lineWidth: 2 }
    });
    holdingBody.emoji = fruitData.emoji;
    Matter.Composite.add(engine.world, holdingBody);
};

const dropFruit = () => {
    isWaiting = true;
    const bodyToDrop = holdingBody;
    Matter.Body.setStatic(bodyToDrop, false);
    bodyToDrop.isSensor = false;
    bodyToDrop.timestamp = Date.now();
    holdingBody = null;

    setTimeout(() => {
        if (!isGameOver) {
            currentHoldingIndex = nextFruitIndex;
            prepareNext();
            createHoldingBody();
            isWaiting = false;
        }
    }, 500);
};

function drawEmojis() {
    const context = render.context;
    if (!context) return;
    const bodies = Matter.Composite.allBodies(engine.world);
    context.textAlign = "center";
    context.textBaseline = "middle";
    bodies.forEach(body => {
        if (body.emoji) {
            const { x, y } = body.position;
            const size = body.circleRadius * 1.55;
            context.font = `bold ${size}px Arial`;
            context.save();
            context.translate(x, y);
            context.rotate(body.angle);
            context.fillText(body.emoji, 0, 0);
            context.restore();
        }
    });
}

function handleCollision(event) {
    event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        if (bodyA.label === bodyB.label && bodyA.label !== 'wall' && !bodyA.isStatic && !bodyB.isStatic) {
            const currentIndex = bodyA.index;
            if (currentIndex < DESSERT.length - 1) {
                const nextIndex = currentIndex + 1;
                const nextData = DESSERT[nextIndex];
                const newX = (bodyA.position.x + bodyB.position.x) / 2;
                const newY = (bodyA.position.y + bodyB.position.y) / 2;
                Matter.Composite.remove(engine.world, [bodyA, bodyB]);
                const newFruit = Matter.Bodies.circle(newX, newY, nextData.size, {
                    label: nextData.label, index: nextIndex, restitution: 0.3, friction: 0.2, timestamp: Date.now(),
                    render: { fillStyle: nextData.color, strokeStyle: '#ffffff', lineWidth: 2 }
                });
                newFruit.emoji = nextData.emoji;
                Matter.Composite.add(engine.world, newFruit);
                currentScore += nextData.score;
                document.getElementById('score').innerText = currentScore;
            }
        }
    });
}

function checkGameOver() {
    if (isGameOver) return;
    const bodies = Matter.Composite.allBodies(engine.world);
    const now = Date.now();
    for (let body of bodies) {
        if (!body.isStatic && body.timestamp && now - body.timestamp > 1200) {
            if (body.position.y < DEAD_LINE) { endGame(); break; }
        }
    }
}

function toggleGuide() {
            const guide = document.getElementById('evolution-guide');
            const overlay = document.getElementById('overlay');
            guide.classList.toggle('show');
            overlay.classList.toggle('show');
}

function endGame() {
    isGameOver = true;
    document.getElementById('game-over').style.display = 'flex';
    document.getElementById('final-score').innerText = currentScore;
}

function resetGame() { location.reload(); }

function shareScore() { 
    if (!Kakao.isInitialized()) {
        Kakao.init("a98f54f492ffb664e66af9546d2652e7");
    }

    Kakao.Link.sendCustom({
        templateId: 129457,
        templateArgs: {    
            'score': currentScore 
        }
    });

 }


function getX(e) {
    const rect = container.getBoundingClientRect();
    return e.clientX - rect.left;
}

window.onload = setup;