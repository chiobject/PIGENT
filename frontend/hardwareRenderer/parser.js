/**
 * 텍스트 문법을 AST(Abstract Syntax Tree)로 변환하는 파서
 */

class Parser {
    constructor() {
        this.errors = [];
    }

    /**
     * 텍스트를 파싱하여 AST 반환
     * @param {string} text - 입력 텍스트
     * @returns {Object} AST { components: [], connections: [] }
     */
    parse(text) {
        this.errors = [];
        const ast = {
            components: [],
            connections: []
        };

        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;

            // 빈 줄이나 주석 무시
            if (line === '' || line.startsWith('#')) {
                continue;
            }

            // 연결 정의인지 확인 (->가 있으면)
            if (line.includes('->')) {
                const connection = this.parseConnection(line, lineNumber);
                if (connection) {
                    ast.connections.push(connection);
                }
            } else {
                // 부품 선언
                const component = this.parseComponent(line, lineNumber);
                if (component) {
                    ast.components.push(component);
                }
            }
        }

        return ast;
    }

    /**
     * 부품 선언 파싱
     * 형식: <type> <id> [at (x, y)]
     * 예: raspberrypi rpi
     *     led red_led at (300, 100)
     */
    parseComponent(line, lineNumber) {
        // at (x, y) 패턴 확인
        const atMatch = line.match(/^(\w+)\s+(\w+)\s+at\s+\((\d+),\s*(\d+)\)$/);
        if (atMatch) {
            return {
                type: atMatch[1],
                id: atMatch[2],
                position: {
                    x: parseInt(atMatch[3]),
                    y: parseInt(atMatch[4])
                },
                lineNumber
            };
        }

        // 위치 지정 없는 패턴
        const simpleMatch = line.match(/^(\w+)\s+(\w+)$/);
        if (simpleMatch) {
            return {
                type: simpleMatch[1],
                id: simpleMatch[2],
                position: null, // 자동 배치
                lineNumber
            };
        }

        this.errors.push({
            line: lineNumber,
            message: `잘못된 부품 선언: ${line}`
        });
        return null;
    }

    /**
     * 연결 정의 파싱
     * 형식: <component>.<pin> -> <component>.<pin>
     * 예: rpi.GPIO17 -> bb.1a
     *      bb.L+1 -> sensor.VCC
     */
    parseConnection(line, lineNumber) {
        // + 와 - 를 포함한 핀 이름 허용
        const match = line.match(/^(\w+)\.([\w\+\-]+)\s*->\s*(\w+)\.([\w\+\-]+)$/);

        if (match) {
            return {
                from: {
                    component: match[1],
                    pin: match[2]
                },
                to: {
                    component: match[3],
                    pin: match[4]
                },
                lineNumber
            };
        }

        this.errors.push({
            line: lineNumber,
            message: `잘못된 연결 정의: ${line}`
        });
        return null;
    }

    /**
     * 파싱 에러 반환
     */
    getErrors() {
        return this.errors;
    }

    /**
     * 에러가 있는지 확인
     */
    hasErrors() {
        return this.errors.length > 0;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Parser;
}
