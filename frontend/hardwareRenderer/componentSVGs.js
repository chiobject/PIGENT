/**
 * 부품 SVG 데이터 (인라인)
 */

const ComponentSVGs = {
    // raspberry-pi-3는 외부 SVG 파일 사용 (Raspberry_Pi_3.svg)
    
    'raspberry-pi-4': `<svg width="340" height="220" viewBox="0 0 340 220" xmlns="http://www.w3.org/2000/svg">
  <!-- 보드 베이스 -->
  <rect x="10" y="10" width="320" height="200" rx="5" fill="#1a7a3e" stroke="#0d5028" stroke-width="2"/>

  <!-- GPIO 헤더 (40핀) -->
  <g id="gpio-header">
    <!-- GPIO 헤더 베이스 -->
    <rect x="30" y="30" width="20" height="160" fill="#1c1c1c" stroke="#000" stroke-width="1"/>

    <!-- GPIO 핀들 (좌측 열 - 짝수) -->
    <circle cx="35" cy="38" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-2"/>
    <circle cx="35" cy="46" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-4"/>
    <circle cx="35" cy="54" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-6"/>
    <circle cx="35" cy="62" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-8"/>
    <circle cx="35" cy="70" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-10"/>
    <circle cx="35" cy="78" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-12"/>
    <circle cx="35" cy="86" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-14"/>
    <circle cx="35" cy="94" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-16"/>
    <circle cx="35" cy="102" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-18"/>
    <circle cx="35" cy="110" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-20"/>
    <circle cx="35" cy="118" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-22"/>
    <circle cx="35" cy="126" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-24"/>
    <circle cx="35" cy="134" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-26"/>
    <circle cx="35" cy="142" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-28"/>
    <circle cx="35" cy="150" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-30"/>
    <circle cx="35" cy="158" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-32"/>
    <circle cx="35" cy="166" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-34"/>
    <circle cx="35" cy="174" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-36"/>
    <circle cx="35" cy="182" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-38"/>
    <circle cx="35" cy="190" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-40"/>

    <!-- GPIO 핀들 (우측 열 - 홀수) -->
    <circle cx="45" cy="38" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-1"/>
    <circle cx="45" cy="46" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-3"/>
    <circle cx="45" cy="54" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-5"/>
    <circle cx="45" cy="62" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-7"/>
    <circle cx="45" cy="70" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-9"/>
    <circle cx="45" cy="78" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-11"/>
    <circle cx="45" cy="86" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-13"/>
    <circle cx="45" cy="94" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-15"/>
    <circle cx="45" cy="102" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-17"/>
    <circle cx="45" cy="110" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-19"/>
    <circle cx="45" cy="118" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-21"/>
    <circle cx="45" cy="126" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-23"/>
    <circle cx="45" cy="134" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-25"/>
    <circle cx="45" cy="142" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-27"/>
    <circle cx="45" cy="150" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-29"/>
    <circle cx="45" cy="158" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-31"/>
    <circle cx="45" cy="166" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-33"/>
    <circle cx="45" cy="174" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-35"/>
    <circle cx="45" cy="182" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-37"/>
    <circle cx="45" cy="190" r="2.5" fill="#ffd700" stroke="#000" stroke-width="0.5" id="pin-39"/>
  </g>

  <!-- USB 포트들 -->
  <rect x="295" y="50" width="30" height="18" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>
  <rect x="295" y="75" width="30" height="18" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>

  <!-- 이더넷 포트 -->
  <rect x="295" y="110" width="30" height="22" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>

  <!-- USB-C 전원 -->
  <rect x="60" y="5" width="25" height="10" fill="#1c1c1c" stroke="#000" stroke-width="1"/>

  <!-- HDMI 포트들 -->
  <rect x="100" y="5" width="20" height="10" fill="#1c1c1c" stroke="#000" stroke-width="1"/>
  <rect x="125" y="5" width="20" height="10" fill="#1c1c1c" stroke="#000" stroke-width="1"/>

  <!-- 오디오 잭 -->
  <circle cx="220" cy="10" r="6" fill="#1c1c1c" stroke="#000" stroke-width="1"/>

  <!-- CPU (칩셋) -->
  <rect x="120" y="80" width="50" height="50" fill="#2c2c2c" stroke="#000" stroke-width="1"/>
  <text x="145" y="108" text-anchor="middle" font-size="8" fill="#fff">BCM</text>
  <text x="145" y="116" text-anchor="middle" font-size="8" fill="#fff">2711</text>

  <!-- SD 카드 슬롯 표시 -->
  <rect x="5" y="145" width="10" height="18" fill="#c0c0c0" stroke="#808080" stroke-width="1"/>

  <!-- 라즈베리파이 로고 텍스트 -->
  <text x="170" y="190" font-size="10" fill="#fff" font-weight="bold">Raspberry Pi 4</text>
</svg>`,

    'breadboard': `<svg width="500" height="350" viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
  <!-- 브레드보드 베이스 -->
  <rect x="0" y="0" width="500" height="350" fill="#ffffff" stroke="#999" stroke-width="2"/>
  
  <!-- 왼쪽 전원 레일 영역 -->
  <rect x="10" y="30" width="40" height="290" fill="#f0f0f0" stroke="#999" stroke-width="1"/>
  
  <!-- 왼쪽 전원 레일 라벨 -->
  <text x="20" y="22" font-size="9" fill="#ff0000" font-weight="bold">+</text>
  <text x="35" y="22" font-size="9" fill="#0000ff" font-weight="bold">-</text>
  
  <!-- 왼쪽 전원 레일 홀 (+ 왼쪽) -->
  ${Array.from({length: 25}, (_, i) => {
    const y = 40 + i * 11;
    return `<circle cx="20" cy="${y}" r="2.5" fill="#333" stroke="#000" stroke-width="0.5"/>`;
  }).join('\n  ')}
  
  <!-- 왼쪽 전원 레일 홀 (- 오른쪽) -->
  ${Array.from({length: 25}, (_, i) => {
    const y = 40 + i * 11;
    return `<circle cx="35" cy="${y}" r="2.5" fill="#333" stroke="#000" stroke-width="0.5"/>`;
  }).join('\n  ')}
  
  <!-- 오른쪽 전원 레일 영역 -->
  <rect x="450" y="30" width="40" height="290" fill="#f0f0f0" stroke="#999" stroke-width="1"/>
  
  <!-- 오른쪽 전원 레일 라벨 -->
  <text x="460" y="22" font-size="9" fill="#ff0000" font-weight="bold">+</text>
  <text x="475" y="22" font-size="9" fill="#0000ff" font-weight="bold">-</text>
  
  <!-- 오른쪽 전원 레일 홀 (+ 왼쪽) -->
  ${Array.from({length: 25}, (_, i) => {
    const y = 40 + i * 11;
    return `<circle cx="460" cy="${y}" r="2.5" fill="#333" stroke="#000" stroke-width="0.5"/>`;
  }).join('\n  ')}
  
  <!-- 오른쪽 전원 레일 홀 (- 오른쪽) -->
  ${Array.from({length: 25}, (_, i) => {
    const y = 40 + i * 11;
    return `<circle cx="475" cy="${y}" r="2.5" fill="#333" stroke="#000" stroke-width="0.5"/>`;
  }).join('\n  ')}
  
  <!-- 중앙 구분선 -->
  <line x1="60" y1="175" x2="440" y2="175" stroke="#999" stroke-width="3"/>
  
  <!-- 열 라벨 (a-e, f-j) -->
  <text x="75" y="45" font-size="8" fill="#666">a</text>
  <text x="100" y="45" font-size="8" fill="#666">b</text>
  <text x="125" y="45" font-size="8" fill="#666">c</text>
  <text x="150" y="45" font-size="8" fill="#666">d</text>
  <text x="175" y="45" font-size="8" fill="#666">e</text>
  
  <text x="275" y="45" font-size="8" fill="#666">f</text>
  <text x="300" y="45" font-size="8" fill="#666">g</text>
  <text x="325" y="45" font-size="8" fill="#666">h</text>
  <text x="350" y="45" font-size="8" fill="#666">i</text>
  <text x="375" y="45" font-size="8" fill="#666">j</text>
  
  <!-- 메인 홀들 (30행 x 10열) -->
  <!-- 상단 (1-15행, a-e와 f-j) -->
  ${Array.from({length: 15}, (_, row) => {
    const rowNum = row + 1;
    const y = 55 + row * 8;
    const holes = [];
    
    // 행 번호 (왼쪽)
    holes.push(`<text x="58" y="${y + 3}" font-size="7" fill="#666">${rowNum}</text>`);
    
    // a-e 열
    [80, 105, 130, 155, 180].forEach(x => {
      holes.push(`<circle cx="${x}" cy="${y}" r="2.5" fill="#333" stroke="#000" stroke-width="0.5"/>`);
    });
    
    // f-j 열
    [280, 305, 330, 355, 380].forEach(x => {
      holes.push(`<circle cx="${x}" cy="${y}" r="2.5" fill="#333" stroke="#000" stroke-width="0.5"/>`);
    });
    
    // 행 번호 (오른쪽)
    holes.push(`<text x="405" y="${y + 3}" font-size="7" fill="#666">${rowNum}</text>`);
    
    return holes.join('\n  ');
  }).join('\n  ')}
  
  <!-- 하단 (16-30행, a-e와 f-j) -->
  ${Array.from({length: 15}, (_, row) => {
    const rowNum = row + 16;
    const y = 185 + row * 8;
    const holes = [];
    
    // 행 번호 (왼쪽)
    holes.push(`<text x="56" y="${y + 3}" font-size="7" fill="#666">${rowNum}</text>`);
    
    // a-e 열
    [80, 105, 130, 155, 180].forEach(x => {
      holes.push(`<circle cx="${x}" cy="${y}" r="2.5" fill="#333" stroke="#000" stroke-width="0.5"/>`);
    });
    
    // f-j 열
    [280, 305, 330, 355, 380].forEach(x => {
      holes.push(`<circle cx="${x}" cy="${y}" r="2.5" fill="#333" stroke="#000" stroke-width="0.5"/>`);
    });
    
    // 행 번호 (오른쪽)
    holes.push(`<text x="405" y="${y + 3}" font-size="7" fill="#666">${rowNum}</text>`);
    
    return holes.join('\n  ');
  }).join('\n  ')}
</svg>`,

    'dht11': `<svg width="80" height="120" viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg">
  <!-- DHT11 센서 본체 -->
  <rect x="10" y="10" width="60" height="80" rx="3" fill="#4169e1" stroke="#1e3a8a" stroke-width="2"/>

  <!-- 센서 그릴 (환기구) -->
  <g id="sensor-grill">
    <rect x="15" y="20" width="50" height="30" fill="#1e3a8a" opacity="0.3"/>
    <line x1="20" y1="25" x2="60" y2="25" stroke="#1e3a8a" stroke-width="1"/>
    <line x1="20" y1="30" x2="60" y2="30" stroke="#1e3a8a" stroke-width="1"/>
    <line x1="20" y1="35" x2="60" y2="35" stroke="#1e3a8a" stroke-width="1"/>
    <line x1="20" y1="40" x2="60" y2="40" stroke="#1e3a8a" stroke-width="1"/>
    <line x1="20" y1="45" x2="60" y2="45" stroke="#1e3a8a" stroke-width="1"/>
  </g>

  <!-- DHT11 텍스트 -->
  <text x="40" y="70" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">DHT11</text>

  <!-- 핀 (3개) -->
  <g id="pins">
    <!-- 핀 1: VCC -->
    <rect x="20" y="95" width="10" height="20" fill="#ffd700" stroke="#000" stroke-width="0.5"/>
    <text x="25" y="108" text-anchor="middle" font-size="8" fill="#000">+</text>

    <!-- 핀 2: DATA -->
    <rect x="35" y="95" width="10" height="20" fill="#ffd700" stroke="#000" stroke-width="0.5"/>
    <text x="40" y="108" text-anchor="middle" font-size="7" fill="#000">D</text>

    <!-- 핀 3: GND -->
    <rect x="50" y="95" width="10" height="20" fill="#ffd700" stroke="#000" stroke-width="0.5"/>
    <text x="55" y="108" text-anchor="middle" font-size="8" fill="#000">G</text>
  </g>

  <!-- 핀 레이블 (하단) -->
  <text x="25" y="118" text-anchor="middle" font-size="6" fill="#666">VCC</text>
  <text x="40" y="118" text-anchor="middle" font-size="6" fill="#666">DATA</text>
  <text x="55" y="118" text-anchor="middle" font-size="6" fill="#666">GND</text>
</svg>`,

    'led': `<svg width="60" height="100" viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg">
  <!-- LED 본체 (흰색) - 상단만 둥글게 -->
  <path d="M 10 45 L 10 15 Q 10 5 20 5 L 40 5 Q 50 5 50 15 L 50 45 Z" fill="#ffffff" stroke="#cccccc" stroke-width="2"/>

  <!-- LED 베이스 (플라스틱 하우징) -->
  <rect x="15" y="45" width="30" height="10" fill="#e0e0e0" stroke="#999999" stroke-width="1"/>

  <!-- 내부 칩 표시 -->
  <rect x="25" y="30" width="10" height="8" fill="#d0d0d0" opacity="0.5"/>

  <!-- 다리 (핀) -->
  <g id="pins">
    <!-- 양극 (+) - 긴 다리 -->
    <rect x="20" y="55" width="3" height="40" fill="#808080" stroke="#666666" stroke-width="0.5"/>
    <text x="22" y="68" text-anchor="middle" font-size="10" fill="#000">+</text>

    <!-- 음극 (-) - 짧은 다리 -->
    <rect x="37" y="55" width="3" height="35" fill="#808080" stroke="#666666" stroke-width="0.5"/>
    <text x="39" y="68" text-anchor="middle" font-size="10" fill="#000">-</text>
  </g>

  <!-- 핀 레이블 (하단) -->
  <text x="22" y="98" text-anchor="middle" font-size="6" fill="#666">ANODE</text>
  <text x="39" y="93" text-anchor="middle" font-size="6" fill="#666">CATHODE</text>
</svg>`,

    'resistor': `<svg width="100" height="40" viewBox="0 0 100 40" xmlns="http://www.w3.org/2000/svg">
  <!-- 저항 본체 -->
  <rect x="20" y="12" width="60" height="16" fill="#d2b48c" stroke="#8b7355" stroke-width="1.5"/>

  <!-- 색상 밴드 (저항값 표시) -->
  <rect x="28" y="10" width="4" height="20" fill="#8b4513"/>
  <rect x="40" y="10" width="4" height="20" fill="#ff0000"/>
  <rect x="52" y="10" width="4" height="20" fill="#ffd700"/>
  <rect x="64" y="10" width="4" height="20" fill="#ffd700"/>

  <!-- 다리 (핀) -->
  <g id="pins">
    <!-- 왼쪽 핀 -->
    <line x1="5" y1="20" x2="20" y2="20" stroke="#808080" stroke-width="2"/>

    <!-- 오른쪽 핀 -->
    <line x1="80" y1="20" x2="95" y2="20" stroke="#808080" stroke-width="2"/>
  </g>

  <!-- 핀 레이블 -->
  <text x="5" y="36" text-anchor="start" font-size="6" fill="#666">PIN1</text>
  <text x="95" y="36" text-anchor="end" font-size="6" fill="#666">PIN2</text>
</svg>`
};
