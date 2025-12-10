/**
 * SVG 회로도 렌더러
 * AST와 부품 라이브러리를 기반으로 최종 회로도 생성
 */

class Renderer {
    constructor(componentLibrary, wireRouter) {
        this.library = componentLibrary;
        this.router = wireRouter;
        this.components = new Map(); // 렌더링된 부품 인스턴스 저장
    }

    /**
     * AST를 기반으로 회로도 렌더링
     * @param {Object} ast - Parser가 생성한 AST
     * @param {HTMLElement} container - 렌더링할 컨테이너 요소
     */
    async render(ast, container) {
        // 컨테이너 초기화
        container.innerHTML = '';

        // SVG 캔버스 생성
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 1200 800');
        svg.style.backgroundColor = '#1e293b';
        container.appendChild(svg);

        // 와이어 색상 인덱스 초기화
        this.router.colorIndex = 0;

        // 부품 렌더링
        await this.renderComponents(svg, ast.components);

        // 와이어 렌더링
        this.renderConnections(svg, ast.connections);

        return svg;
    }

    /**
     * 모든 부품 렌더링
     */
    async renderComponents(svg, components) {
        this.components.clear();

        let autoX = 50;
        let autoY = 50;

        for (const comp of components) {
            const metadata = this.library.getComponent(comp.type);
            if (!metadata) {
                console.error(`알 수 없는 부품: ${comp.type}`);
                continue;
            }

            // 위치 결정 (자동 또는 수동)
            const x = comp.position ? comp.position.x : autoX;
            const y = comp.position ? comp.position.y : autoY;

            // SVG 이미지 로드 및 배치
            const group = await this.createComponentGroup(metadata, x, y);
            if (group) {
                svg.appendChild(group);

                // 부품 인스턴스 저장
                this.components.set(comp.id, {
                    type: comp.type,
                    metadata,
                    position: { x, y },
                    scaleX: 1,
                    scaleY: 1
                });
            }

            // 자동 배치 위치 업데이트
            if (!comp.position) {
                const compWidth = comp.type === 'breadboard' ? 500 : metadata.width;
                autoX += compWidth + 100;
                if (autoX > 1000) {
                    autoX = 50;
                    autoY += 250;
                }
            }
        }
    }

    /**
     * 부품 SVG 그룹 생성
     */
    async createComponentGroup(metadata, x, y) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // 브레드보드는 큰 viewBox를 가지므로 스케일 다운
        let scale = 1;
        let displayWidth = metadata.width;
        let displayHeight = metadata.height;

        if (metadata.id === 'breadboard') {
            // 브레드보드 SVG는 21000x29700 viewBox를 가짐
            // 이를 600x400으로 스케일 다운
            displayWidth = 600;
            displayHeight = 400;
            scale = displayWidth / metadata.width; // 600 / 21000 = 0.02857
        }

        // translate만 적용 (scale은 핀 좌표 계산 시 적용)
        group.setAttribute('transform', `translate(${x}, ${y})`);

        try {
            // 인라인 SVG 데이터가 있으면 사용
            if (ComponentSVGs && ComponentSVGs[metadata.id]) {
                const svgText = ComponentSVGs[metadata.id];

                // SVG를 DOM으로 파싱
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const svgElement = svgDoc.documentElement;

                // 브레드보드인 경우 viewBox 없이 직접 표시
                if (metadata.id === 'breadboard') {
                    // SVG 내용을 그룹에 직접 추가
                    Array.from(svgElement.children).forEach(child => {
                        const clonedChild = child.cloneNode(true);
                        group.appendChild(clonedChild);
                    });
                } else {
                    // SVG 내용을 그룹에 직접 추가
                    Array.from(svgElement.children).forEach(child => {
                        const clonedChild = child.cloneNode(true);
                        group.appendChild(clonedChild);
                    });
                }
            } else {
                // 외부 SVG 파일 로드
                const svgPath = `/static/components/${metadata.image}`;
                
                try {
                    const response = await fetch(svgPath);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const svgText = await response.text();
                    
                    // SVG 파싱
                    const parser = new DOMParser();
                    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                    const svgElement = svgDoc.documentElement;
                    
                    // 파싱 에러 체크
                    const parserError = svgDoc.querySelector('parsererror');
                    if (parserError) {
                        throw new Error('SVG 파싱 실패');
                    }
                    
                    // nested SVG로 감싸기
                    const nested = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    
                    if (metadata.id === 'breadboard') {
                        nested.setAttribute('width', displayWidth);
                        nested.setAttribute('height', displayHeight);
                        nested.setAttribute('viewBox', `0 0 ${metadata.width} ${metadata.height}`);
                    } else {
                        nested.setAttribute('width', metadata.width);
                        nested.setAttribute('height', metadata.height);
                        if (svgElement.hasAttribute('viewBox')) {
                            nested.setAttribute('viewBox', svgElement.getAttribute('viewBox'));
                        }
                    }
                    
                    // SVG 내용 복사
                    Array.from(svgElement.children).forEach(child => {
                        nested.appendChild(child.cloneNode(true));
                    });
                    
                    group.appendChild(nested);
                } catch (e) {
                    console.error(`SVG 로드 실패 (${metadata.id}):`, e.message);
                }
            }

            return group;
        } catch (error) {
            console.error(`SVG 로드 실패: ${metadata.id}`, error);
            return null;
        }
    }

    /**
     * 모든 연결선 렌더링
     */
    renderConnections(svg, connections) {
        for (const conn of connections) {
            const fromComp = this.components.get(conn.from.component);
            const toComp = this.components.get(conn.to.component);

            if (!fromComp || !toComp) {
                console.error(`연결 오류: 부품을 찾을 수 없음`, conn);
                continue;
            }

            // 핀 좌표 가져오기
            const fromPin = this.library.getPin(fromComp.type, conn.from.pin);
            const toPin = this.library.getPin(toComp.type, conn.to.pin);

            if (!fromPin || !toPin) {
                console.error(`연결 오류: 핀을 찾을 수 없음`, conn);
                continue;
            }

            // 절대 좌표 계산
            const fromPos = {
                x: fromComp.position.x + fromPin.x * fromComp.scaleX,
                y: fromComp.position.y + fromPin.y * fromComp.scaleY
            };

            const toPos = {
                x: toComp.position.x + toPin.x * toComp.scaleX,
                y: toComp.position.y + toPin.y * toComp.scaleY
            };

            // 와이어 그리기
            const color = this.router.getColorForConnection(conn);
            const wire = this.router.createWire(fromPos, toPos, null, color);
            svg.appendChild(wire);
        }
    }

    /**
     * 렌더링된 부품 정보 가져오기
     */
    getComponentInfo() {
        return {
            count: this.components.size,
            list: Array.from(this.components.keys())
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
