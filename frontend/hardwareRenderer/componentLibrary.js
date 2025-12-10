/**
 * 부품 라이브러리 관리
 * JSON 메타데이터를 로드하고 제공
 */

class ComponentLibrary {
    constructor() {
        this.components = new Map();
        this.loaded = false;
    }

    /**
     * 기본 부품 라이브러리 초기화
     */
    async init() {
        const componentsToLoad = [
            { type: 'raspberrypi', file: 'raspberry-pi-3.json' },
            { type: 'raspberry-pi-3', file: 'raspberry-pi-3.json' },
            { type: 'rpi', file: 'raspberry-pi-3.json' },
            { type: 'breadboard', file: 'breadboard.json' },
            { type: 'bb', file: 'breadboard.json' },
            { type: 'dht11', file: 'dht11.json' },
            { type: 'led', file: 'led.json' },
            { type: 'resistor', file: 'resistor.json' }
        ];

        for (const comp of componentsToLoad) {
            try {
                const response = await fetch(`/static/components/${comp.file}`);
                const data = await response.json();
                this.components.set(comp.type, data);
                console.log(`${comp.type} 로드 완료`);
            } catch (error) {
                console.error(`${comp.type} 로드 실패:`, error);
            }
        }

        this.loaded = true;
        console.log('ComponentLibrary 초기화 완료, 로드된 타입:', this.getAvailableTypes());
    }

    /**
     * 부품 메타데이터 가져오기
     * @param {string} type - 부품 타입
     * @returns {Object|null} 부품 메타데이터
     */
    getComponent(type) {
        return this.components.get(type) || null;
    }

    /**
     * 부품의 특정 핀 정보 가져오기
     * @param {string} type - 부품 타입
     * @param {string} pinName - 핀 이름 (예: 'GPIO17')
     * @returns {Object|null} 핀 정보 { name, number, x, y, type }
     */
    getPin(type, pinName) {
        const component = this.getComponent(type);
        if (!component) {
            console.error(`부품 타입을 찾을 수 없음: ${type}`);
            return null;
        }

        const pin = component.pins.find(p =>
            p.name === pinName || (p.number && p.number.toString() === pinName)
        );

        if (!pin) {
            console.error(`핀을 찾을 수 없음: ${type}.${pinName}`);
            return null;
        }

        return pin;
    }

    /**
     * 부품 크기 가져오기
     * @param {string} type - 부품 타입
     * @returns {Object|null} { width, height }
     */
    getSize(type) {
        const component = this.getComponent(type);
        if (!component) return null;
        return {
            width: component.width,
            height: component.height
        };
    }

    /**
     * 등록된 모든 부품 타입 목록
     * @returns {string[]} 부품 타입 배열
     */
    getAvailableTypes() {
        return Array.from(this.components.keys());
    }

    /**
     * 라이브러리가 로드되었는지 확인
     * @returns {boolean}
     */
    isLoaded() {
        return this.loaded;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLibrary;
}
