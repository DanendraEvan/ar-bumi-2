/* model.js - Lapisan Atmosfer Bumi untuk Earth AR Scanner
   Model dibuat langsung dengan three.js (bawaan A-Frame), jadi tidak perlu file .glb.
   Klik nomor 1-5: lapisan itu saja yang tampil, lapisan lain hilang. Reset Zoom menampilkan semuanya. */
   (function () {
    const T = AFRAME.THREE, TAU = Math.PI * 2, OFF = 5.6; // OFF: bumi diangkat agar berdiri di atas marker
    let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const rdir = () => { const u = rnd() * 2 - 1, a = rnd() * TAU, q = Math.sqrt(1 - u * u); return new T.Vector3(q * Math.cos(a), u, q * Math.sin(a)); };
    const Y = new T.Vector3(0, 1, 0);
  
    // [kunci, nama, ketinggian, r0, r1, warna, penjelasan]
    const LAY = [
      ['tro', 'Troposfer', '0 – 12 km', 5, 5.7, 0x8ccaff, 'Lapisan tempat kita hidup. Suhu turun sekitar 6,5 °C setiap naik 1 km. Awan, hujan, angin, dan hampir semua cuaca terjadi di sini. Isi: awan, balon udara, pesawat penumpang.'],
      ['str', 'Stratosfer', '12 – 50 km', 5.7, 6.5, 0x5aa0ee, 'Udara tenang dan kering. Lapisan ozon menyerap sebagian besar sinar ultraviolet berbahaya. Suhu naik dari sekitar −60 °C hingga 0 °C. Isi: lapisan ozon, pesawat jet, balon cuaca.'],
      ['mes', 'Mesosfer', '50 – 85 km', 6.5, 7.4, 0x3f7fd8, 'Lapisan terdingin (sekitar −90 °C). Sebagian besar meteoroid terbakar di sini dan tampak sebagai bintang jatuh.'],
      ['the', 'Termosfer', '85 – 600 km', 7.4, 8.8, 0x2f66c4, 'Suhu bisa mencapai sekitar 2.000 °C, tetapi udaranya sangat tipis. Garis Karman (100 km) dianggap batas ruang angkasa. Aurora muncul di sini, dan stasiun luar angkasa mengorbit di lapisan ini.'],
      ['exo', 'Eksosfer', '600 – 10.000 km', 8.8, 10.4, 0x2b4aa8, 'Lapisan terluar. Gas hidrogen dan helium sangat renggang dan sebagian lepas ke angkasa. Isi: satelit GPS, satelit komunikasi, teleskop luar angkasa.']
    ];
  
    // Titik nomor: anchor menempel di lapisan, pin di sisi kanan model (tinggi berurutan, tidak saling silang)
    const hotspots = LAY.map((l, i) => {
      const rm = (l[3] + l[4]) / 2, th = (25 + (4 - i) * 20) * Math.PI / 180;
      return {
        id: String(i + 1), badge: 'LAPISAN #' + (i + 1), title: l[1] + ' (' + l[2] + ')', desc: l[6],
        anchor: [+(rm * Math.sin(th)).toFixed(2), +(rm * Math.cos(th) + OFF).toFixed(2), 0],
        pin: [13.5, +(OFF - 9 + i * 4.5).toFixed(2), 0],
        targetScale: 0.07, targetPos: { x: 0, y: 0, z: 0 }
      };
    });
  
    window.MODEL_CONFIG = { nama: 'Atmosfer Bumi', komponen: 'atmosfer-model', scale: 0.045, pinScale: 3.2, animasi: false, position: '0 0 0', rotation: '0 0 0', hotspots: hotspots };
  
    // Tampilkan hanya satu lapisan (id nomor titik), atau semua bila null
    window.isolasiLapisan = function (id) {
      const el = document.getElementById('model-utama'), c = el && el.components['atmosfer-model'];
      if (!c) return;
      const k = id ? LAY[+id - 1][0] : null;
      Object.keys(c.LG).forEach(x => { c.LG[x].visible = !k || x === k; });
    };
  
    AFRAME.registerComponent('atmosfer-model', {
      init: function () {
        const root = new T.Group(); root.position.y = OFF;
        const LG = this.LG = {}, orb = this.orb = [], self = this;
        LAY.forEach(l => { LG[l[0]] = new T.Group(); root.add(LG[l[0]]); });
        let cur = 'tro';
        const M = (c, e) => new T.MeshLambertMaterial({ color: c, flatShading: true, emissive: e || 0 });
        const box = (w, h, d, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x || 0, y || 0, z || 0); return o; };
        const cyl = (r, l, m) => { const o = new T.Mesh(new T.CylinderGeometry(r, r, l, 8), m); o.rotation.x = Math.PI / 2; return o; };
        const cone = (r, l, m, z, dir) => { const o = new T.Mesh(new T.ConeGeometry(r, l, 8), m); o.rotation.x = dir * Math.PI / 2; o.position.z = z; return o; };
        const fin = (g, s) => { g.scale.setScalar(s); return g; };
        const SOL = () => M(0x2a4fb0, 0x0a1a50);
        const ring = (r, c, o) => { const p = []; for (let i = 0; i <= 96; i++) p.push(new T.Vector3(Math.cos(i / 96 * TAU) * r, Math.sin(i / 96 * TAU) * r, 0)); return new T.Line(new T.BufferGeometry().setFromPoints(p), new T.LineBasicMaterial({ color: c, transparent: true, opacity: o })); };
  
        // Bumi
        const BL = [[5,20,30,22],[-17,25,16,16],[27,15,12,28],[50,60,20,60],[32,95,22,30],[25,50,10,14],[60,20,12,25],[20,78,10,8],[-2,115,5,14],[-3,135,4,10],[47,-100,20,28],[65,-105,12,35],[20,-100,10,12],[72,-40,9,14],[-10,-60,20,14],[-32,-66,18,9],[-25,135,10,17],[-40,172,6,4]];
        const land = (la, lo) => { if (la < -72) return 1; for (const b of BL) { const dl = (la - b[0]) / b[2], dn = (((lo - b[1] + 540) % 360) - 180) / b[3]; if (dl * dl + dn * dn < 1) return 1; } return 0; };
        const earth = this.earth = new T.Group(); root.add(earth);
        const g = new T.IcosahedronGeometry(5, 4).toNonIndexed(), p = g.attributes.position, c = [], col = new T.Color();
        for (let i = 0; i < p.count; i += 3) {
          const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
          const la = Math.asin(cy / Math.hypot(cx, cy, cz)) * 180 / Math.PI, lo = Math.atan2(cx, cz) * 180 / Math.PI, n = Math.abs((Math.sin(cx * 91.7 + cy * 47.3 + cz * 13.1) * 43758.5) % 1);
          if (land(la, lo)) {
            if (Math.abs(la) > 68) col.set(0xf1f5f9); else col.setHSL(.15 + .12 * Math.abs(Math.sin(la * .07 + lo * .05)), .62, .36 + .1 * n);
            for (let j = 0; j < 3; j++) p.setXYZ(i + j, p.getX(i + j) * 1.035, p.getY(i + j) * 1.035, p.getZ(i + j) * 1.035);
          } else col.setHSL(.56, .88, .36 + .12 * n);
          for (let j = 0; j < 3; j++) c.push(col.r, col.g, col.b);
        }
        g.setAttribute('color', new T.Float32BufferAttribute(c, 3));
        earth.add(new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true, flatShading: true })));
        earth.add(new T.Mesh(new T.SphereGeometry(4.95, 32, 24), new T.MeshLambertMaterial({ color: 0x0b4f9e, side: T.DoubleSide })));
  
        // Cangkang tiap lapisan
        LAY.forEach(l => {
          const sh = new T.Mesh(new T.SphereGeometry(l[4], 40, 28), new T.MeshBasicMaterial({ color: l[5], transparent: true, opacity: .16, side: T.DoubleSide, depthWrite: false }));
          sh.renderOrder = Math.round(200 - l[4] * 10); LG[l[0]].add(sh); LG[l[0]].add(ring(l[4], 0xffffff, .4));
        });
        const oz = new T.Mesh(new T.SphereGeometry(6.05, 32, 24), new T.MeshBasicMaterial({ color: 0x6ef0b0, transparent: true, opacity: .16, side: T.DoubleSide, depthWrite: false }));
        oz.renderOrder = 150; LG.str.add(oz); LG.str.add(ring(6.05, 0x6ef0b0, .8));
        LG.the.add(ring(7.7, 0xffffff, .8)); LG.exo.add(ring(8.8, 0xffd27a, .8));
  
        // Benda
        const cloud = () => { const g = new T.Group(), m = M(0xffffff, 0x4a4a55); [[0,0,0,.2],[.2,-.03,.04,.15],[-.2,-.03,-.03,.14],[.05,.07,-.05,.14]].forEach(a => { const o = new T.Mesh(new T.IcosahedronGeometry(a[3], 0), m); o.position.set(a[0], a[1], a[2]); g.add(o); }); return g; };
        const balloon = (s, cols) => { const g = new T.Group(), geo = new T.IcosahedronGeometry(.2, 1).toNonIndexed(), q = geo.attributes.position, cc = [], k = new T.Color();
          for (let i = 0; i < q.count; i += 3) { const a = Math.atan2(q.getX(i) + q.getX(i + 1) + q.getX(i + 2), q.getZ(i) + q.getZ(i + 1) + q.getZ(i + 2)); k.set(cols[Math.floor((a + Math.PI) / TAU * 8) % cols.length]); for (let j = 0; j < 3; j++) cc.push(k.r, k.g, k.b); }
          geo.setAttribute('color', new T.Float32BufferAttribute(cc, 3));
          const b = new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true, flatShading: true })); b.position.y = .22; g.add(b); g.add(box(.07, .05, .07, M(0x8d6e63), 0, -.03, 0)); return fin(g, s); };
        const plane = (c, s, jet) => { const g = new T.Group(), m = M(c), w = jet ? .5 : .75;
          g.add(cyl(.05, .6, m)); g.add(cone(.05, .16, m, -.38, -1)); g.add(box(w, .014, jet ? .24 : .14, M(jet ? 0x5d6d7e : 0xcfd8e8)));
          g.add(box(.012, .13, .1, M(jet ? 0x5d6d7e : 0xe53935), 0, .08, .26)); g.add(box(w * .4, .012, .07, m, 0, 0, .27)); return fin(g, s); };
        const sat = (s, body) => { const g = new T.Group(); g.add(box(.18, .18, .28, M(body || 0xd4af37))); [-1, 1].forEach(k => g.add(box(.5, .02, .2, SOL(), k * .4, 0, 0))); g.add(cone(.08, .1, M(0xeeeeee), -.2, -1)); return fin(g, s); };
        const station = s => { const g = new T.Group(); g.add(box(1.1, .03, .03, M(0xcfcfcf))); g.add(cyl(.06, .42, M(0xf2f2f2))); [-.5, -.3, .3, .5].forEach(x => g.add(box(.16, .01, .38, SOL(), x, 0, 0))); return fin(g, s); };
        const rocket = s => { const g = new T.Group(), r = M(0xe53935); g.add(cyl(.06, .5, M(0xf5f5f5))); g.add(cone(.06, .18, r, -.34, -1));
          for (let k = 0; k < 3; k++) { const h = new T.Group(); h.rotation.z = k * TAU / 3; h.add(box(.012, .14, .1, r, 0, .09, .2)); g.add(h); }
          g.add(cone(.05, .24, new T.MeshBasicMaterial({ color: 0xffa726 }), .38, 1)); return fin(g, s); };
        const scope = s => { const g = new T.Group(); g.add(cyl(.09, .5, M(0xb0b8c4))); [-1, 1].forEach(k => g.add(box(.4, .015, .16, SOL(), k * .3, 0, .1))); return fin(g, s); };
        const meteor = () => { const g = new T.Group(); g.add(new T.Mesh(new T.DodecahedronGeometry(.07, 0), M(0xff7a1a, 0xff4a00))); g.add(cone(.05, .55, new T.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: .65 }), -.3, -1)); return g; };
        const orbit = (m, r, sp, tilt, ph) => { const pv = new T.Group(), sg = new T.Group(), h = new T.Group();
          pv.rotation.set(tilt[0], tilt[1], tilt[2]); sg.rotation.y = ph; h.position.x = r; h.rotation.z = -Math.PI / 2; h.add(m); sg.add(h); pv.add(sg); LG[cur].add(pv); orb.push({ g: sg, s: sp }); };
  
        cur = 'tro';
        const clouds = this.clouds = new T.Group(); LG.tro.add(clouds);
        for (let i = 0; i < 11; i++) { const d = rdir(), cl = cloud(); cl.position.copy(d).multiplyScalar(5.3); cl.quaternion.setFromUnitVectors(Y, d); cl.scale.setScalar(1 + rnd() * .5); clouds.add(cl); }
        orbit(balloon(1.7, [0xe53935, 0xffb300]), 5.32, .07, [.4, 0, .3], 0);
        orbit(balloon(1.5, [0x1e88e5, 0xffffff]), 5.32, .06, [-.7, 0, .9], 2);
        orbit(plane(0xffffff, 1.9), 5.58, .28, [.3, 0, .2], 1);
        orbit(plane(0xffffff, 1.9), 5.58, -.22, [-.5, 0, -.6], 3.5);
        cur = 'str';
        orbit(plane(0x8896a8, 1.9, true), 6.25, .4, [.9, 0, -.3], 0);
        orbit(plane(0x8896a8, 1.9, true), 6.25, -.34, [-.3, 0, .8], 2.5);
        orbit(balloon(1.1, [0xffffff, 0xc0c8d4]), 6.38, .08, [.2, 0, -1], 1);
        cur = 'mes';
        const mets = this.mets = []; for (let i = 0; i < 7; i++) { const m = meteor(); LG.mes.add(m); mets.push({ g: m, t: rnd(), sp: .22 + rnd() * .25, d: rdir() }); }
        cur = 'the';
        orbit(station(2), 8.0, .2, [.9, 0, .5], 0);
        orbit(rocket(2), 7.75, .32, [-.4, 0, -.8], 2);
        orbit(sat(2), 8.4, -.25, [.2, 0, 1.2], 1);
        const auro = this.auro = []; [1, -1].forEach(k => { const a = new T.Mesh(new T.TorusGeometry(2.7, .14, 6, 48), new T.MeshBasicMaterial({ color: 0x5dffa0, transparent: true, opacity: .6 })); a.rotation.x = Math.PI / 2; a.position.y = 7.45 * k; LG.the.add(a); auro.push(a); });
        cur = 'exo';
        orbit(sat(1.8), 9.3, .17, [.5, 0, .4], 0);
        orbit(sat(1.8), 9.3, .17, [-.6, 0, 1.3], 2.1);
        orbit(scope(2), 9.7, .12, [1.1, 0, .2], 1);
        orbit(sat(2.4, 0xeaeaea), 10.0, .08, [-.2, 0, .6], 3);
        const pp = new Float32Array(480); for (let i = 0; i < 160; i++) { const d = rdir().multiplyScalar(8.9 + rnd() * 1.4); pp.set([d.x, d.y, d.z], i * 3); }
        const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pp, 3));
        LG.exo.add(new T.Points(pg, new T.PointsMaterial({ color: 0xcfe9ff, size: .1 })));
  
        this.tm = 0; this.el.setObject3D('mesh', root); this.root = root;
      },
      tick: function (time, delta) {
        if (!this.orb) return;
        const dt = Math.min(delta / 1000, .05); this.tm += dt;
        this.earth.rotation.y += dt * .08; this.clouds.rotation.y += dt * .1;
        this.orb.forEach(o => { o.g.rotation.y += o.s * dt; });
        this.mets.forEach(m => { m.t += m.sp * dt; if (m.t > 1) { m.t = 0; m.d = rdir(); }
          m.g.position.copy(m.d).multiplyScalar(7.4 - m.t * .9); m.g.lookAt(0, 0, 0); m.g.scale.setScalar(Math.max(.02, 1 - m.t * m.t * .95)); });
        this.auro.forEach((a, i) => { a.material.opacity = .4 + .25 * Math.sin(this.tm * 1.6 + i * 2); });
      },
      remove: function () { this.el.removeObject3D('mesh'); }
    });
  })();