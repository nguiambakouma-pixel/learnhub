/**
 * SIMULATIONS ENGINE - KMERSCHOOL
 * Physics and Chemistry Interactive Simulations
 */

class Simulation {
    constructor(canvasId, containerId, controlsId) {
        this.canvas = document.getElementById(canvasId);
        if (this.canvas) this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById(containerId);
        this.controls = document.getElementById(controlsId);
        this.explanation = document.getElementById('explanation-text');
        this.animationId = null;
        this.isRunning = false;
        this.isStopped = false;
        
        if (this.container) {
            this.resizeObserver = new ResizeObserver(() => this.resize());
            this.resizeObserver.observe(this.container);
            this.resize();
        }
    }

    resize() {
        if (this.canvas && this.container) {
            this.canvas.width = this.container.clientWidth;
            this.canvas.height = this.container.clientHeight;
        }
    }

    start() {
        this.isRunning = true;
        this.loop();
    }

    stop() {
        this.isRunning = false;
        this.isStopped = true;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.controls) this.controls.innerHTML = '';
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container) this.container.innerHTML = '';
        }
    }

    loop() {
        if (!this.isRunning) return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    }

    update() {}
    draw() {}

    setExplanation(text) {
        if (this.explanation) this.explanation.innerHTML = text;
    }
}

/**
 * 1. OPTIQUE GÉOMÉTRIQUE
 */
class OptiqueSimulation extends Simulation {
    constructor(canvasId, containerId, controlsId) {
        super(canvasId, containerId, controlsId);
        this.params = { focalLength: 150, objX: -250, objH: 80, showRays: true };
        this.initControls();
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.isDragging = false);
        this.isDragging = false;
    }

    initControls() {
        this.controls.innerHTML = `
            <div class="control-group">
                <div class="control-label">Distance Focale <span class="control-value">${this.params.focalLength} px</span></div>
                <input type="range" id="input-focal" min="50" max="300" value="${this.params.focalLength}">
            </div>
            <div class="control-group">
                <div class="control-label">Position Objet <span class="control-value">${Math.abs(this.params.objX)} px</span></div>
                <input type="range" id="input-x" min="-500" max="-10" value="${this.params.objX}">
            </div>
        `;
        document.getElementById('input-focal').oninput = (e) => { this.params.focalLength = parseInt(e.target.value); this.updateExplanation(); };
        document.getElementById('input-x').oninput = (e) => { this.params.objX = parseInt(e.target.value); this.updateExplanation(); };
        this.updateExplanation();
    }

    updateExplanation() {
        const u = Math.abs(this.params.objX); const f = this.params.focalLength;
        let text = u > 2*f ? "Objet loin (> 2f') : Image réelle, renversée et réduite." :
                   u === 2*f ? "Objet à 2f' : Image réelle, renversée, même taille." :
                   u > f ? "Objet entre f' et 2f' : Image réelle et agrandie." :
                   u === f ? "Objet au foyer : Image à l'infini." : "Objet < f' : Image virtuelle et agrandie (**Loupe**).";
        this.setExplanation(text);
    }

    draw() {
        const ctx = this.ctx; const w = this.canvas.width; const h = this.canvas.height;
        const cx = w/2; const cy = h/2;
        ctx.clearRect(0,0,w,h);

        // Optic Axis
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke(); ctx.setLineDash([]);

        // Lens
        ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cx, cy - 200); ctx.lineTo(cx, cy + 200); ctx.stroke();
        // Lens arrows (Convergent)
        ctx.beginPath(); ctx.moveTo(cx-10, cy-190); ctx.lineTo(cx, cy-200); ctx.lineTo(cx+10, cy-190); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-10, cy+190); ctx.lineTo(cx, cy+200); ctx.lineTo(cx+10, cy+190); ctx.stroke();

        const f = this.params.focalLength;
        const ox = this.params.objX; const oh = this.params.objH;
        
        // Focals
        ctx.fillStyle = '#F5B800'; 
        ctx.beginPath(); ctx.arc(cx - f, cy, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + f, cy, 5, 0, Math.PI*2); ctx.fill();
        ctx.font = "bold 14px Syne"; ctx.fillText("F", cx - f - 5, cy + 25); ctx.fillText("F'", cx + f - 5, cy + 25);

        // Object
        ctx.strokeStyle = '#F0F4FF'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(cx + ox, cy); ctx.lineTo(cx + ox, cy - oh); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+ox-8, cy-oh+12); ctx.lineTo(cx+ox, cy-oh); ctx.lineTo(cx+ox+8, cy-oh+12); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.fillText("Objet", cx + ox - 20, cy + 20);

        // Image
        const v = 1 / (1 / f + 1 / ox); const ih = -oh * v / ox;
        ctx.strokeStyle = '#F5B800'; ctx.lineWidth = 4;
        if (v < 0) ctx.setLineDash([5, 5]); // Virtual
        ctx.beginPath(); ctx.moveTo(cx + v, cy); ctx.lineTo(cx + v, cy - ih); ctx.stroke();
        ctx.setLineDash([]);
        
        const sign = ih > 0 ? -1 : 1;
        ctx.beginPath(); ctx.moveTo(cx+v-8, cy-ih-sign*12); ctx.lineTo(cx+v, cy-ih); ctx.lineTo(cx+v+8, cy-ih-sign*12); ctx.stroke();
        ctx.fillText(v > 0 ? "Image Réelle" : "Image Virtuelle", cx + v - 40, cy - ih - 20);

        // Rays
        if (this.params.showRays) {
            ctx.lineWidth = 1;
            // Parallel ray
            ctx.strokeStyle = "rgba(244, 63, 94, 0.6)";
            ctx.beginPath(); ctx.moveTo(cx + ox, cy - oh); ctx.lineTo(cx, cy - oh); ctx.lineTo(cx + (v > 0 ? v : w/2), cy - (v > 0 ? ih : -oh*(w/2)/f + oh)); ctx.stroke();
            if (v < 0) { // Virtual extension
                ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(cx, cy - oh); ctx.lineTo(cx + v, cy - ih); ctx.stroke(); ctx.setLineDash([]);
            }
            // Center ray
            ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
            ctx.beginPath(); ctx.moveTo(cx + ox, cy - oh); ctx.lineTo(cx + (v > 0 ? v : w/2), cy - (v > 0 ? ih : oh*(w/2)/ox)); ctx.stroke();
            if (v < 0) { // Virtual extension
                ctx.setLineDash([5,5]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + v, cy - ih); ctx.stroke(); ctx.setLineDash([]);
            }
        }
    }
    handleMouseDown(e) { /* Interaction logic */ }
    handleMouseMove(e) { if(this.isDragging) { /* ... */ } }
}

/**
 * 2. ATOME DE BOHR (PRO VERSION)
 */
class AtomeSimulation extends Simulation {
    constructor(containerId, controlsId) {
        super(null, containerId, controlsId);
        this.init();
        this.initControls();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
        this.camera.position.z = 15;

        // Nucleus (Sun-like)
        const nucleus = new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 32), new THREE.MeshPhongMaterial({ color: 0xff4444, emissive: 0x440000 }));
        this.scene.add(nucleus);

        // Orbits
        this.orbits = [];
        for (let n = 1; n <= 4; n++) {
            const radius = n * 3;
            const geo = new THREE.TorusGeometry(radius, 0.02, 16, 100);
            const mat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3 });
            const orbit = new THREE.Mesh(geo, mat);
            orbit.rotation.x = Math.PI / 2;
            this.scene.add(orbit);
            this.orbits.push(radius);
        }

        // Electron
        this.electron = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), new THREE.MeshPhongMaterial({ color: 0x3388ff, emissive: 0x002244 }));
        this.scene.add(this.electron);

        const light = new THREE.PointLight(0xffffff, 1.5, 100); light.position.set(10, 10, 10); this.scene.add(light);
        this.scene.add(new THREE.AmbientLight(0x404040));

        this.n = 2; this.angle = 0;
        this.animate();
    }

    initControls() {
        this.controls.innerHTML = `
            <div class="control-group">
                <div class="control-label">Niveaux d'énergie (n)</div>
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px">
                    <button class="btn-action" onclick="window.currentSimulation.jump(1)">n=1</button>
                    <button class="btn-action" onclick="window.currentSimulation.jump(2)">n=2</button>
                    <button class="btn-action" onclick="window.currentSimulation.jump(3)">n=3</button>
                    <button class="btn-action" onclick="window.currentSimulation.jump(4)">n=4</button>
                </div>
            </div>
        `;
        this.updateExplanation();
    }

    jump(n) {
        if (n < this.n) this.emitPhoton();
        this.n = n;
        this.updateExplanation();
    }

    emitPhoton() {
        const photon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
        photon.position.copy(this.electron.position);
        this.scene.add(photon);
        const dir = photon.position.clone().normalize();
        const anim = () => {
            photon.position.add(dir.multiplyScalar(0.2));
            if (photon.position.length() < 20) requestAnimationFrame(anim);
            else this.scene.remove(photon);
        };
        anim();
    }

    updateExplanation() {
        this.setExplanation(`L'électron est au niveau **n = ${this.n}**. Une transition vers un niveau inférieur émet de la lumière (photon). C'est le principe des **spectres d'émission**.`);
    }

    animate() {
        if (this.isStopped) return;
        requestAnimationFrame(() => this.animate());
        this.angle += 0.03 / this.n;
        const r = this.n * 3;
        this.electron.position.set(Math.cos(this.angle)*r, 0, Math.sin(this.angle)*r);
        this.renderer.render(this.scene, this.camera);
    }
}

/**
 * 3. PENDULE SIMPLE (PRO VERSION)
 */
class PenduleSimulation extends Simulation {
    constructor(canvasId, containerId, controlsId) {
        super(canvasId, containerId, controlsId);
        this.params = { length: 200, g: 9.81, angle: Math.PI/4, vel: 0 };
        this.initControls();
    }
    initControls() {
        this.controls.innerHTML = `
            <div class="control-group">
                <div class="control-label">Longueur du fil <span class="control-value">${(this.params.length/100).toFixed(1)} m</span></div>
                <input type="range" id="input-l" min="50" max="350" value="${this.params.length}">
            </div>
            <button class="btn-action" onclick="window.currentSimulation.reset()">Lancer l'oscillation</button>
        `;
        document.getElementById('input-l').oninput = (e) => { this.params.length = parseInt(e.target.value); this.updateExplanation(); };
        this.updateExplanation();
    }
    reset() { this.params.angle = Math.PI/4; this.params.vel = 0; }
    updateExplanation() {
        const T = 2 * Math.PI * Math.sqrt((this.params.length/100) / this.params.g);
        this.setExplanation(`La période théorique est de **${T.toFixed(2)} secondes**. Plus le fil est long, plus l'oscillation est lente.`);
    }
    update() {
        const dt = 0.2;
        const acc = -(this.params.g / (this.params.length/10)) * Math.sin(this.params.angle);
        this.params.vel += acc * dt;
        this.params.angle += this.params.vel * dt;
    }
    draw() {
        const ctx = this.ctx; const w=this.canvas.width; const h=this.canvas.height;
        const cx=w/2; const cy=50; ctx.clearRect(0,0,w,h);
        const px = cx + Math.sin(this.params.angle)*this.params.length;
        const py = cy + Math.cos(this.params.angle)*this.params.length;
        ctx.strokeStyle='#4A5568'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(px,py); ctx.stroke();
        ctx.fillStyle='#F5B800'; ctx.beginPath(); ctx.arc(px,py,15,0,Math.PI*2); ctx.fill();
    }
}

/**
 * 4. FENTES DE YOUNG
 */
class YoungSimulation extends Simulation {
    constructor(canvasId, containerId, controlsId) {
        super(canvasId, containerId, controlsId);
        this.params = { wavelength: 550, a: 0.15, D: 2 };
        this.initControls();
    }
    initControls() {
        this.controls.innerHTML = `
            <div class="control-group">
                <div class="control-label">Longueur d'onde (λ) <span class="control-value">${this.params.wavelength} nm</span></div>
                <input type="range" id="input-w" min="400" max="700" value="${this.params.wavelength}">
            </div>
            <div class="control-group">
                <div class="control-label">Distance entre fentes (a) <span class="control-value">${this.params.a} mm</span></div>
                <input type="range" id="input-a" min="0.1" max="0.5" step="0.01" value="${this.params.a}">
            </div>
        `;
        document.getElementById('input-w').oninput = (e) => { this.params.wavelength = parseInt(e.target.value); this.updateExplanation(); };
        document.getElementById('input-a').oninput = (e) => { this.params.a = parseFloat(e.target.value); this.updateExplanation(); };
        this.updateExplanation();
    }
    updateExplanation() {
        const i = (this.params.wavelength * 1e-9 * this.params.D) / (this.params.a * 1e-3);
        this.setExplanation(`L'interfrange est de **${(i * 1000).toFixed(2)} mm**. <br><br>• Augmenter la longueur d'onde **écarte** les franges.<br>• Diminuer l'écart entre les fentes **écarte** également les franges.`);
    }
    draw() {
        const ctx=this.ctx; const w=this.canvas.width; const h=this.canvas.height; ctx.clearRect(0,0,w,h);
        const cy=h/2; 
        
        // Setup view
        ctx.fillStyle = "#1a2340"; ctx.fillRect(100, cy - 120, 15, 240); // Slit Plate
        ctx.fillStyle = "#000"; ctx.fillRect(w - 120, 40, 100, h - 80); // Screen

        const a_px = this.params.a * 150;
        ctx.clearRect(100, cy - a_px - 2, 15, 4); ctx.clearRect(100, cy + a_px - 2, 15, 4);
        ctx.fillStyle = "#fff"; ctx.font = "12px DM Sans"; ctx.fillText("Fentes", 80, cy - 130);
        
        const i_px = (this.params.wavelength * 1e-9 * this.params.D / (this.params.a * 1e-3)) * 800;
        const color = `hsl(${240-(this.params.wavelength-400)*0.8}, 100%, 50%)`;
        
        for(let y=40; y<h-40; y++){
            const intensity = Math.pow(Math.cos(Math.PI*(y-cy)/i_px),2);
            ctx.globalAlpha=intensity; ctx.fillStyle=color; ctx.fillRect(w-120,y,100,1);
        }
        ctx.globalAlpha = 1; ctx.strokeStyle = "#fff"; ctx.strokeRect(w - 120, 40, 100, h - 80);
        ctx.fillText("Écran d'observation", w - 140, 30);
        
        // Rays
        ctx.setLineDash([10, 10]); ctx.strokeStyle = color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(100, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(115, cy - a_px); ctx.lineTo(w - 120, cy - a_px); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(115, cy + a_px); ctx.lineTo(w - 120, cy + a_px); ctx.stroke();
        ctx.setLineDash([]);
    }
}

/**
 * 5. CIRCUIT RLC
 */
class RLCSimulation extends Simulation {
    constructor(canvasId, containerId, controlsId) {
        super(canvasId, containerId, controlsId);
        this.params = { R: 40, L: 0.2, C: 0.0004, freq: 50 };
        this.time = 0; this.data = [];
        this.initControls();
    }
    initControls() {
        this.controls.innerHTML = `
            <div style="background:rgba(255,255,255,0.05); padding:20px; border-radius:12px; margin-bottom:15px; border: 1px solid var(--border-lit)">
                <div style="font-size:11px; color:var(--text-muted); margin-bottom:10px; text-transform:uppercase; letter-spacing:1px">Schéma Électrique</div>
                <svg width="240" height="80" viewBox="0 0 240 80" style="color:var(--gold); display:block; margin:auto">
                    <circle cx="30" cy="40" r="15" fill="none" stroke="currentColor" stroke-width="2"/>
                    <path d="M 22 40 Q 30 25 38 40 T 30 55 T 22 40" fill="none" stroke="currentColor" stroke-width="1.5"/>
                    <line x1="45" y1="40" x2="60" y2="40" stroke="currentColor"/>
                    <rect x="60" y="32" width="40" height="16" fill="none" stroke="currentColor" stroke-width="2"/>
                    <line x1="100" y1="40" x2="115" y2="40" stroke="currentColor"/>
                    <path d="M 115 40 Q 120 20 125 40 Q 130 60 135 40 Q 140 20 145 40 Q 150 60 155 40" fill="none" stroke="currentColor" stroke-width="2"/>
                    <line x1="155" y1="40" x2="170" y2="40" stroke="currentColor"/>
                    <line x1="170" y1="25" x2="170" y2="55" stroke="currentColor" stroke-width="2"/>
                    <line x1="180" y1="25" x2="180" y2="55" stroke="currentColor" stroke-width="2"/>
                    <line x1="180" y1="40" x2="210" y2="40" stroke="currentColor"/>
                    <line x1="210" y1="40" x2="210" y2="70" stroke="currentColor"/>
                    <line x1="210" y1="70" x2="30" y2="70" stroke="currentColor"/>
                    <line x1="30" y1="70" x2="30" y2="55" stroke="currentColor"/>
                    <text x="75" y="25" font-size="10" fill="#fff">R</text>
                    <text x="130" y="25" font-size="10" fill="#fff">L</text>
                    <text x="170" y="20" font-size="10" fill="#fff">C</text>
                </svg>
            </div>
            <div class="control-group">
                <div class="control-label">Résistance (R) <span class="control-value">${this.params.R} Ω</span></div>
                <input type="range" id="input-r" min="1" max="200" value="${this.params.R}">
            </div>
            <div class="control-group">
                <div class="control-label">Capacité (C) <span class="control-value">${(this.params.C*1e6).toFixed(0)} µF</span></div>
                <input type="range" id="input-c" min="50" max="1000" value="${this.params.C*1e6}">
            </div>
        `;
        document.getElementById('input-r').oninput = (e) => { this.params.R = parseFloat(e.target.value); this.updateExplanation(); };
        document.getElementById('input-c').oninput = (e) => { this.params.C = parseFloat(e.target.value)/1e6; this.updateExplanation(); };
        this.updateExplanation();
    }
    updateExplanation() {
        const f0 = 1 / (2 * Math.PI * Math.sqrt(this.params.L * this.params.C));
        const Q = (1 / this.params.R) * Math.sqrt(this.params.L / this.params.C);
        this.setExplanation(`Fréquence propre **f0 = ${f0.toFixed(1)} Hz**.<br><br>Le circuit est en **résonance** lorsque la fréquence du générateur égale f0.<br>Plus **R** est faible, plus la résonance est **aiguë** (Q = ${Q.toFixed(2)}).`);
    }
    update() {
        this.time += 0.016;
        const v = 8 * Math.sin(100 * Math.PI * this.time);
        const i = (8/this.params.R) * Math.sin(100 * Math.PI * this.time - 0.6);
        this.data.push({ v, i }); if(this.data.length > 250) this.data.shift();
    }
    draw() {
        const ctx=this.ctx; const w=this.canvas.width; const h=this.canvas.height; ctx.clearRect(0,0,w,h);
        const cy = h / 2;
        
        ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = 1;
        for(let j=0; j<w; j+=50) { ctx.beginPath(); ctx.moveTo(j, 0); ctx.lineTo(j, h); ctx.stroke(); }
        for(let j=0; j<h; j+=50) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke(); }

        ctx.lineWidth = 3;
        ctx.strokeStyle='#F43F5E'; ctx.beginPath();
        this.data.forEach((d,idx) => {
            const x = 50 + idx*(w-100)/250; const y = cy - d.v*15;
            if(idx===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();

        ctx.strokeStyle='#3B82F6'; ctx.beginPath();
        this.data.forEach((d,idx) => {
            const x = 50 + idx*(w-100)/250; const y = cy - d.i*400;
            if(idx===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        });
        ctx.stroke();
        
        ctx.fillStyle = '#fff'; ctx.font = "bold 14px Syne";
        ctx.fillText("Oscilloscope : Tension (rouge) / Intensité (bleu)", 50, 40);
    }
}



/**
 * GLOBAL INITIALIZER
 */
window.initSimulation = function(type) {
    if (window.currentSimulation) window.currentSimulation.stop();
    const canvas = document.getElementById('sim-canvas');
    const threeCont = document.getElementById('three-container');
    if(canvas) canvas.style.display = 'none';
    if(threeCont) { threeCont.style.display = 'none'; threeCont.innerHTML = ''; }

    if (type === 'optique') { canvas.style.display = 'block'; window.currentSimulation = new OptiqueSimulation('sim-canvas', 'canvas-wrapper', 'controls'); window.currentSimulation.start(); }
    else if (type === 'atome') { threeCont.style.display = 'block'; window.currentSimulation = new AtomeSimulation('three-container', 'controls'); }
    else if (type === 'pendule') { canvas.style.display = 'block'; window.currentSimulation = new PenduleSimulation('sim-canvas', 'canvas-wrapper', 'controls'); window.currentSimulation.start(); }
    else if (type === 'fente') { canvas.style.display = 'block'; window.currentSimulation = new YoungSimulation('sim-canvas', 'canvas-wrapper', 'controls'); window.currentSimulation.start(); }
    else if (type === 'rlc') { canvas.style.display = 'block'; window.currentSimulation = new RLCSimulation('sim-canvas', 'canvas-wrapper', 'controls'); window.currentSimulation.start(); }
};
