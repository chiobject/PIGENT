/**
 * 와이어 라우팅
 * 두 핀 사이의 연결선 경로 계산 및 SVG 생성
 */

class WireRouter {
    constructor() {
        this.routingMode = 'orthogonal'; // 'straight', 'orthogonal', 'curved'
        
        // 다양한 색상 팔레트 (전원/그라운드 제외)
        this.colorPalette = [
            '#4ecdc4',  // 청록
            '#45b7d1',  // 파랑
            '#feca57',  // 노랑
            '#ff9ff3',  // 분홍
            '#54a0ff',  // 하늘색
            '#48dbfb',  // 밝은 파랑
            '#1dd1a1',  // 민트
            '#ffa502',  // 주황
            '#ff6348',  // 코랄
            '#5f27cd',  // 보라
            '#00d2d3',  // 시안
            '#2ed573',  // 초록
        ];
        this.colorIndex = 0;
        this.connectionColors = new Map(); // 연결별 색상 저장
    }

    /**
     * 연결 타입에 따른 색상 결정
     * @param {Object} connection - 연결 정보
     * @returns {string} 색상
     */
    getColorForConnection(connection) {
        const connectionKey = `${connection.from.component}.${connection.from.pin}->${connection.to.component}.${connection.to.pin}`;
        
        // 이미 할당된 색상이 있으면 재사용
        if (this.connectionColors.has(connectionKey)) {
            return this.connectionColors.get(connectionKey);
        }
        
        // 핀 이름으로 타입 판단
        const fromPin = connection.from.pin.toUpperCase();
        const toPin = connection.to.pin.toUpperCase();
        
        let color;
        
        // 전원 연결 (+ 레일, VCC, 3V3, 5V)
        if (fromPin.includes('+') || toPin.includes('+') ||
            fromPin.includes('VCC') || toPin.includes('VCC') ||
            fromPin.includes('3V3') || toPin.includes('3V3') ||
            fromPin.includes('5V') || toPin.includes('5V')) {
            color = '#ff0000'; // 빨강
        }
        // 그라운드 연결 (- 레일, GND)
        else if (fromPin.includes('-') || toPin.includes('-') ||
                 fromPin.includes('GND') || toPin.includes('GND') ||
                 fromPin.includes('GROUND') || toPin.includes('GROUND')) {
            color = '#000000'; // 검정
        }
        // 신호선 - 각각 다른 색상
        else {
            color = this.colorPalette[this.colorIndex % this.colorPalette.length];
            this.colorIndex++;
        }
        
        this.connectionColors.set(connectionKey, color);
        return color;
    }

    /**
     * 와이어 SVG 요소 생성
     * @param {Object} fromPos - 시작 좌표 { x, y }
     * @param {Object} toPos - 끝 좌표 { x, y }
     * @param {string} type - 와이어 타입 (선택)
     * @param {string} customColor - 커스텀 색상 (선택)
     * @returns {SVGElement} 와이어 SVG 요소
     */
    createWire(fromPos, toPos, type = 'default', customColor = null) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'wire');

        let path;
        switch (this.routingMode) {
            case 'straight':
                path = this.createStraightPath(fromPos, toPos);
                break;
            case 'orthogonal':
                path = this.createOrthogonalPath(fromPos, toPos);
                break;
            case 'curved':
                path = this.createCurvedPath(fromPos, toPos);
                break;
            default:
                path = this.createOrthogonalPath(fromPos, toPos);
        }

        // 색상 결정: customColor가 있으면 사용, 없으면 기본 색상
        let color = customColor || '#fbbf24'; // 기본 노란색

        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');

        group.appendChild(path);

        // 시작점과 끝점에 원 추가
        const startDot = this.createDot(fromPos.x, fromPos.y, color);
        const endDot = this.createDot(toPos.x, toPos.y, color);

        group.appendChild(startDot);
        group.appendChild(endDot);

        return group;
    }

    /**
     * 직선 경로
     */
    createStraightPath(fromPos, toPos) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`;
        path.setAttribute('d', d);
        return path;
    }

    /**
     * 직각 경로 (Fritzing 스타일)
     * 수평 → 수직 → 수평
     */
    createOrthogonalPath(fromPos, toPos) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;

        // 중간 지점 계산
        const midX1 = fromPos.x + dx * 0.5;
        const midY = fromPos.y;
        const midX2 = midX1;
        const midY2 = toPos.y;

        // 경로: 시작 → 수평 → 수직 → 수평 → 끝
        const d = `
            M ${fromPos.x} ${fromPos.y}
            L ${midX1} ${midY}
            L ${midX2} ${midY2}
            L ${toPos.x} ${toPos.y}
        `;

        path.setAttribute('d', d);
        return path;
    }

    /**
     * 곡선 경로 (베지어 곡선)
     */
    createCurvedPath(fromPos, toPos) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;

        // 제어점 계산
        const controlPoint1X = fromPos.x + dx * 0.5;
        const controlPoint1Y = fromPos.y;
        const controlPoint2X = fromPos.x + dx * 0.5;
        const controlPoint2Y = toPos.y;

        // 3차 베지어 곡선
        const d = `
            M ${fromPos.x} ${fromPos.y}
            C ${controlPoint1X} ${controlPoint1Y},
              ${controlPoint2X} ${controlPoint2Y},
              ${toPos.x} ${toPos.y}
        `;

        path.setAttribute('d', d);
        return path;
    }

    /**
     * 연결점 점 생성
     */
    createDot(x, y, color) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', color);
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '1');
        return circle;
    }

    /**
     * 라우팅 모드 설정
     * @param {string} mode - 'straight', 'orthogonal', 'curved'
     */
    setRoutingMode(mode) {
        if (['straight', 'orthogonal', 'curved'].includes(mode)) {
            this.routingMode = mode;
        }
    }

    /**
     * 현재 라우팅 모드 반환
     */
    getRoutingMode() {
        return this.routingMode;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WireRouter;
}
