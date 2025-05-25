import RPi.GPIO as GPIO
import time
import requests
GPIO.setmode(GPIO.BOARD)
GPIO.setwarnings(False)

leds = {'red': 11, 'green': 13, 'blue': 15}
for color, pin in leds.items():
    GPIO.setup(pin, GPIO.OUT)
    GPIO.output(pin, GPIO.LOW)  # Inicialmente apagados

GPIO.output(leds['red'], GPIO.HIGH)
button_on_pin = 16   # Botón para ENCENDER (LED azul)
button_off_pin = 18  # Botón para APAGAR (LED azul y verde)
GPIO.setup(button_on_pin, GPIO.IN)
GPIO.setup(button_off_pin, GPIO.IN)

url = "https://xvxsfhnjxj.execute-api.us-east-1.amazonaws.com/dev/registroRFID"
def call_api(numero_rfid):
    try:
        response = requests.post(url, json={"numeroTarjetaRFID": numero_rfid})
        return response.status_code
    except requests.exceptions.RequestException as e:
        print(f"Error al conectar con la API: {e}")
        return None
try:
    while True:
        numero_rfid = input("Ingrese el número de la tarjeta RFID (debe ser 10 dígitos): ")
        if len(numero_rfid) == 10 and numero_rfid.isdigit():
            response_status = call_api(numero_rfid)
            
            if response_status == 200:
                print("Respuesta 200 recibida. Activando modo de botones.")
                # Apagar LED rojo y encender LED verde
                GPIO.output(leds['red'], GPIO.LOW)
                GPIO.output(leds['green'], GPIO.HIGH)
                blue_led_on = False  # Bandera para controlar el estado del LED azul
                while True:
                    if GPIO.input(button_on_pin) == GPIO.LOW:  # Botón ENCENDER
                        if not blue_led_on:
                            GPIO.output(leds['blue'], GPIO.HIGH)
                            blue_led_on = True
                            print("Botón ENCENDER accionado: LED azul encendido.")
                            time.sleep(0.3)  # Retardo para evitar rebotes
                    elif GPIO.input(button_off_pin) == GPIO.LOW:  # Botón APAGAR
                        # Apagar LED azul y LED verde y volver al estado inicial
                        GPIO.output(leds['blue'], GPIO.LOW)
                        GPIO.output(leds['green'], GPIO.LOW)
                        blue_led_on = False
                        print("Botón APAGAR accionado: LED azul y verde apagados. Volviendo a modo RFID.")
                        time.sleep(0.3)  # Retardo para evitar rebotes
                        GPIO.output(leds['red'], GPIO.HIGH)  # Encender LED rojo nuevamente
                        break  # Salir del bucle de botones para volver a solicitar el RFID
                    time.sleep(0.1)  # Pequeño retardo en el bucle 
            else:
                print("Respuesta de la API incorrecta o error de conexión.")
        else:
            print("Error: El número RFID debe tener exactamente 10 dígitos y solo contener números.")
except KeyboardInterrupt:
    print("Programa terminado por el usuario")
finally:
    GPIO.cleanup()  # Limpiar configuración de GPIO