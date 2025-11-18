// 목업 채팅 기록 데이터
const mockChatHistory = [
    {
        id: 1700000001,
        title: "LED 깜빡이기 프로젝트",
        timestamp: "2024-01-15T10:30:00Z",
        messages: [
            {
                type: "user",
                content: "라즈베리파이에서 LED를 1초마다 깜빡이게 하고 싶어요"
            },
            {
                type: "bot",
                content: "LED 깜빡이기 실행 준비가 완료되었습니다.\n\n```python\nimport RPi.GPIO as GPIO\nimport time\n\n# GPIO 설정\nLED_PIN = 17\nGPIO.setmode(GPIO.BCM)\nGPIO.setup(LED_PIN, GPIO.OUT)\n\ntry:\n    while True:\n        GPIO.output(LED_PIN, GPIO.HIGH)\n        time.sleep(1)\n        GPIO.output(LED_PIN, GPIO.LOW)\n        time.sleep(1)\nexcept KeyboardInterrupt:\n    GPIO.cleanup()\n```"
            }
        ]
    },
    {
        id: 1700000002,
        title: "온도 센서 데이터 읽기",
        timestamp: "2024-01-14T15:45:00Z",
        messages: [
            {
                type: "user",
                content: "DHT11 센서로 온도와 습도를 측정하는 방법을 알려주세요"
            },
            {
                type: "bot",
                content: "온도 및 습도 측정 실행 준비가 완료되었습니다.\n\n```python\nimport Adafruit_DHT\nimport time\n\n# 센서 타입 및 핀 설정\nDHT_SENSOR = Adafruit_DHT.DHT11\nDHT_PIN = 4\n\nwhile True:\n    humidity, temperature = Adafruit_DHT.read(DHT_SENSOR, DHT_PIN)\n    \n    if humidity is not None and temperature is not None:\n        print(f\"온도: {temperature}°C, 습도: {humidity}%\")\n    else:\n        print(\"센서 읽기 실패\")\n    \n    time.sleep(2)\n```"
            }
        ]
    },
    {
        id: 1700000003,
        title: "서보 모터 제어하기",
        timestamp: "2024-01-13T09:20:00Z",
        messages: [
            {
                type: "user",
                content: "서보 모터를 90도로 회전시키고 싶습니다"
            },
            {
                type: "bot",
                content: "서보 모터 제어 실행 준비가 완료되었습니다.\n\n```python\nimport RPi.GPIO as GPIO\nimport time\n\nSERVO_PIN = 18\n\nGPIO.setmode(GPIO.BCM)\nGPIO.setup(SERVO_PIN, GPIO.OUT)\n\n# PWM 설정 (50Hz)\npwm = GPIO.PWM(SERVO_PIN, 50)\npwm.start(0)\n\ndef set_angle(angle):\n    duty = angle / 18 + 2\n    GPIO.output(SERVO_PIN, True)\n    pwm.ChangeDutyCycle(duty)\n    time.sleep(1)\n    GPIO.output(SERVO_PIN, False)\n    pwm.ChangeDutyCycle(0)\n\n# 90도로 회전\nset_angle(90)\n\ntime.sleep(2)\npwm.stop()\nGPIO.cleanup()\n```"
            }
        ]
    },
    {
        id: 1700000004,
        title: "초음파 센서로 거리 측정",
        timestamp: "2024-01-12T14:10:00Z",
        messages: [
            {
                type: "user",
                content: "HC-SR04 초음파 센서로 거리를 측정하려고 합니다"
            },
            {
                type: "bot",
                content: "거리 측정 실행 준비가 완료되었습니다.\n\n```python\nimport RPi.GPIO as GPIO\nimport time\n\nTRIG = 23\nECHO = 24\n\nGPIO.setmode(GPIO.BCM)\nGPIO.setup(TRIG, GPIO.OUT)\nGPIO.setup(ECHO, GPIO.IN)\n\ndef measure_distance():\n    GPIO.output(TRIG, True)\n    time.sleep(0.00001)\n    GPIO.output(TRIG, False)\n    \n    while GPIO.input(ECHO) == 0:\n        pulse_start = time.time()\n    \n    while GPIO.input(ECHO) == 1:\n        pulse_end = time.time()\n    \n    pulse_duration = pulse_end - pulse_start\n    distance = pulse_duration * 17150\n    distance = round(distance, 2)\n    \n    return distance\n\ntry:\n    while True:\n        dist = measure_distance()\n        print(f\"거리: {dist}cm\")\n        time.sleep(1)\nexcept KeyboardInterrupt:\n    GPIO.cleanup()\n```"
            }
        ]
    },
    {
        id: 1700000005,
        title: "버튼으로 LED 제어",
        timestamp: "2024-01-11T11:30:00Z",
        messages: [
            {
                type: "user",
                content: "버튼을 누르면 LED가 켜지고 다시 누르면 꺼지게 하고 싶어요"
            },
            {
                type: "bot",
                content: "버튼으로 LED 제어 실행 준비가 완료되었습니다.\n\n```python\nimport RPi.GPIO as GPIO\nimport time\n\nBUTTON_PIN = 27\nLED_PIN = 17\n\nGPIO.setmode(GPIO.BCM)\nGPIO.setup(BUTTON_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)\nGPIO.setup(LED_PIN, GPIO.OUT)\n\nled_state = False\nlast_button_state = True\n\ntry:\n    while True:\n        button_state = GPIO.input(BUTTON_PIN)\n        \n        # 버튼이 눌렸을 때 (하강 에지)\n        if last_button_state and not button_state:\n            led_state = not led_state\n            GPIO.output(LED_PIN, led_state)\n            time.sleep(0.2)  # 디바운싱\n        \n        last_button_state = button_state\n        time.sleep(0.01)\n        \nexcept KeyboardInterrupt:\n    GPIO.cleanup()\n```"
            }
        ]
    }
];

// 목업 응답 데이터
const mockResponses = [
    "코드를 생성했습니다. GPIO 핀을 사용하는 예제입니다.",
    "라즈베리파이에서 센서를 읽는 방법을 구현했습니다.",
    "PWM을 사용한 제어 코드를 작성했습니다.",
    "실시간 데이터를 읽어오는 코드입니다."
];

// 랜덤 응답 생성 함수
function generateMockResponse(userInput) {
    return new Promise((resolve) => {
        // 2-4초 사이의 랜덤 지연
        const delay = 2000 + Math.random() * 2000;

        setTimeout(() => {
            const response = `실행 준비가 완료되었습니다.\n\n\`\`\`python\nimport RPi.GPIO as GPIO\nimport time\n\n# GPIO 설정\nGPIO.setmode(GPIO.BCM)\nGPIO.setup(17, GPIO.OUT)\n\ntry:\n    while True:\n        GPIO.output(17, GPIO.HIGH)\n        time.sleep(1)\n        GPIO.output(17, GPIO.LOW)\n        time.sleep(1)\nexcept KeyboardInterrupt:\n    GPIO.cleanup()\n\`\`\``;

            resolve({
                status: 'success',
                response: response
            });
        }, delay);
    });
}
