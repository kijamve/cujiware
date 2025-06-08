/*

Tienes una tarea, debes convertir toda esta data cruda en un archivo json con la siguiente estructura:
[
    {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "country": "VE|AR|CL|CO|MX|PE|UY|UY|...",
        "membership": {
            "plan_name": "Básica",
            "price": PRICE_IN_FLOAT,
            "interval": "MONTH|SEMESTER|YEAR",
            "start_date": "YYYY-MM-DD",
            "end_date": "YYYY-MM-DD"
        },
        "billing": {
            "address": "ADDRESS",
            "phone": "VE",
        },
        "licenses": ['CODIGO_UUID'],
    }
]


Cada customer estara separado por una linea  que sera exactamente esta:
#####################

El campo billing solo aplica para Venezuela. No lo agregues para otros paises.

Para todos los paises se debe agregar el nombre, membership, pais y el email en la raiz.

Un ejemplo de como debe ser el archivo json es el siguiente:

#4525 por Jose Gonzalez
Básica - 1 Sitio
12,00 U$D / mes

junio 2, 2025	julio 2, 2025

Jose Gonzalez
V26709194
Calle 91-2, Maracaibo, Venezuela

Dirección de correo electrónico:
jjgonzc@gmail.com	

91d7326d-0fc3-4778-8e5a-39f82928aa21
#####################
#4507 por CARLOS DEL CASTILLO
Básica Semestral - 1 Sitio
51,72 U$D cada 6 meses

mayo 28, 2025	diciembre 28, 2025

CARLOS DEL CASTILLO
Estados Unidos (EEUU)
+17868983865
rodcarlos11@gmail.com

7497ba78-d1fe-4cd0-938a-6d5e51c888db

El archivo json debe ser el siguiente:

[
    {
        "name": "Jose Gonzalez",
        "email": "jjgonzc@gmail.com",
        "country": "VE",
        "membership": {
            "plan_name": "Básica - 1 Sitio",
            "price": 12,
            "interval": "MONTH",
            "start_date": "2025-06-02",
            "end_date": "2025-07-02"
        },
        "billing_address": {
            "address": "Calle 91-2, Maracaibo, Venezuela",
            "phone": "VE"
        },
        "licenses": ['91d7326d-0fc3-4778-8e5a-39f82928aa21']
    },
    {
        "name": "CARLOS DEL CASTILLO",
        "email": "rodcarlos11@gmail.com",
        "country": "AR",
        "membership": {
            "plan_name": "Básica Semestral - 1 Sitio",
            "price": 51.72,
            "interval": "SEMESTER",
            "start_date": "2025-05-28",
            "end_date": "2025-12-28"
        },
        "licenses": ['7497ba78-d1fe-4cd0-938a-6d5e51c888db']    
    }
]

La data cruda es la siguiente:

#4525 por Jose Gonzalez
Básica - 1 Sitio
12,00 U$D / mes

junio 2, 2025	julio 2, 2025

Jose Gonzalez
V26709194
Calle 91-2, Maracaibo, Venezuela

Dirección de correo electrónico:
jjgonzc@gmail.com	

91d7326d-0fc3-4778-8e5a-39f82928aa21
#####################
#4512 por Tallal Henaui
Básica Semestral - 1 Sitio
60,00 U$D cada 6 meses

mayo 28, 2025	noviembre 28, 2025

TALLAL HENAUI SALAHE
V11238735
CARABOBO, VALENCIA, SAN JOSE, Venezuela
+584143462111
tallalh@hotmail.com

d638952f-8510-4785-b2ec-9a9e306452c4
#####################
#4507 por CARLOS DEL CASTILLO
Básica Semestral - 1 Sitio
51,72 U$D cada 6 meses

mayo 28, 2025	diciembre 28, 2025

CARLOS DEL CASTILLO
Estados Unidos (EEUU)
+17868983865
rodcarlos11@gmail.com

7497ba78-d1fe-4cd0-938a-6d5e51c888db
#####################
#4501 por Gerente Sistemas
Básica Anual - 1 Sitio
120,00 U$D / año

mayo 27, 2025	mayo 27, 2026

INVERSIONES APARCITY S A
J001829610
AV LA ESTANCIA CC CENTRO COMERCIAL CIUDAD TAMANACO NIVEL LOBBY LOCAL HOTEL CCT URB CHUAO CARACAS (CHACAO) MIRANDA ZONA POSTAL 1061, Venezuela
+582127008000
gerente.sis@hotelcct.com

ef577a8c-3bc4-4959-bd34-1ee64acee740
#####################
#4495 por Liam Fung
Básica Anual - 1 Sitio
120,00 U$D / año

mayo 27, 2025	mayo 27, 2026

Liam Fung
29856925
mañongo valencia Carabobo, Venezuela
+584125052777
carovastore@gmail.com

1c61af9e-ed65-4994-b895-02b387e1636e
#####################
#4492 por Victor Bitar
Básica - 1 Sitio
12,00 U$D / mes

mayo 27, 2025	junio 27, 2025

VICTOR ELIAS BITAR BADDOUR
V23534481
MONAGAS, MATURIN, SAN SIMON, Venezuela
+584249480518
baddourv181@gmail.com

6ddc1985-973b-4258-ad7e-fe622e6222d6
#####################
#4490 por Marianna Sapiro
Básica - 1 Sitio
10,34 U$D / mes

mayo 26, 2025	junio 26, 2025

Uruguay

plazacafeadm@gmail.com

ad5e24ba-d9f0-4f6d-a505-0c533906d5c3
#####################
#4486 por Lucas Sempé
Básica - 1 Sitio
10,34 U$D / mes

mayo 26, 2025	junio 26, 2025

Lucas Sempé
37273624
Malvinas Rosa quiroga 148, Departamento, Argentina
+543544307585
sempelucas@gmail.com

d118f72f-7dce-4f92-9b7e-68e9b21cdca7
#####################
#4481 por Angelica Rangel
Básica - 1 Sitio
12,00 U$D / mes

mayo 23, 2025	junio 23, 2025

ANGELICA MARIA RANGEL MACHADO
V23692896
Caracas, Venezuela
+584241913404
armsalud24@gmail.com

39a09137-8b5d-41b1-9921-829207e7bc26
#####################
#4479 por SURTI DONUTS C.A.
Básica Semestral - 1 Sitio
60,00 U$D cada 6 meses

mayo 21, 2025	noviembre 21, 2025

SURTI DONUTS C.A.
J317011503
Calle Colon, Qta Oracion, PB Nro 19 Loc A, Urb Los Caobos, Caracas, Distrito Capital, Venezuela
+584126095695
surtidonuts.gest@gmail.com
	
21471951-480d-471a-9e22-735a5059863c
#####################
#4475 por Leonardo Rafael Grabow
Básica - 1 Sitio
10,34 U$D / mes

mayo 20, 2025	junio 20, 2025	

Argentina
clientesbinweb@gmail.com

76ce6212-d5d9-4ffc-b1a2-4d732e5d70f5
#####################
#4461 por Hidrotech Argentina SA
Básica - 1 Sitio
10,34 U$D / mes

mayo 15, 2025	junio 15, 2025

jlopez@hidrofil.com.ar

32086a50-3109-4554-938a-1f7adc4a15cc
#####################
#4447 por ALEISA Medina
Básica - 1 Sitio
12,00 U$D / mes

mayo 9, 2025	10 de junio de 2025

Aleisa Medina
412485563
Porlamar, Nueva Esparta, Venezuela
+584147911995
gibranimport@gmqil.com

79bfbabf-e07e-4f63-914e-ca4125b65b1e
#####################
#4442 por Pedro Poller
Membership - Básica - 1 Sitio
12,00 U$D / mes

mayo 9, 2025	10 de junio 2025

PEDRO JOSE POLLER CASTRO
V19985896
GUARICO, ROSCIO, PARAPARA, Venezuela
+584126119034
aclgestion2024@gmail.com

7adf1496-51d0-40db-abb7-5dc5533381f9
#####################
#4437 por Rayner Alvarez
Básica - 1 Sitio
12,00 U$D / mes

mayo 9, 2025	2025-06-09

RAYNER RICARDO ALVAREZ GARCIA
V22410730
CARABOBO, NAGUANAGUA, NAGUANAGUA, Venezuela
+584145817152
raynericardo@gmail.com

f3bd2b96-b2d5-4d95-b172-e38bc6d10191
#####################
#4425 por Hugo Montilla
Básica Semestral - 1 Sitio
60,00 U$D cada 6 meses

mayo 7, 2025	noviembre 7, 2025

HUGO GERARDO MONTILLA LEAL
V16607915
ZULIA, MARACAIBO, FRANCISCO EUGENIO, Venezuela
+584146058166
a1plusve@gmail.com

86d376e1-b180-430e-8de9-eee29f98c9ca
#####################
#4400 por Pablo Albarracin
Básica Semestral - 1 Sitio
51,72 U$D cada 6 meses

mayo 2, 2025	noviembre 2, 2025

Pablo Albarracin
Argentina
palbarracin@frappe.com.ar

227175d2-7dec-4ec6-97b6-a5a94ede97f0
#####################
#4337 por Eduardo Agustin Usandizaga
Básica Anual - 1 Sitio
103,45 U$D / año

abril 15, 2025	abril 15, 2026

Eduardo Agustin Usandizaga
Argentina
anuessle@sumainversiones.com.ar

1144d333-ca3a-4ac7-a9bb-f3239fe56a9b
#####################
#4327 por Julieta Lindner
Básica - 1 Sitio
5,17 U$D / mes

abril 10, 2025	2025-06-12

Julieta Lindner
marittimactivewear@gmail.com

fe0a62c6-f394-4e65-8b3b-14c798d659d2
#####################
#4308 por Giomar rogger Rios peralta
Básica Semestral - 1 Sitio
51,72 U$D cada 6 meses

abril 3, 2025	octubre 3, 2025
giomar rogger rios peralta
Argentina
riperink30@gmail.com

54e4fdd6-089a-43b9-bf64-bb985387689e
#####################
#4299 por Lucas Bertotti
Básica Anual - 1 Sitio
103,45 U$D / año

marzo 31, 2025	marzo 31, 2026

Lucas Bertotti
Argentina
sistemas@tp3d.com.ar
	
c8bda8b7-927a-4214-b4c3-e35e0fbdec0b
#####################
#4296 por VISAGISMO S.R.L.
Básica - 1 Sitio
10,34 U$D / mes

marzo 31, 2025	julio 5, 2025

VISAGISMO S.R.L.
Argentina
prestashop@lurebyms.com

60c4b9f4-360a-47c1-b804-815a7f03235f
#####################
#4288 por Jesus Alvarado
Básica Anual - 1 Sitio
120,00 U$D / año

marzo 29, 2025	marzo 29, 2026

Jesus Alvarado
28670687
Anzoategui, Venezuela
+584123445822

joffreyzuly@gmail.com

de7d991f-104c-4fe5-9d73-1446483b5319
#####################
#4280 por INVERSIONES CAHERSI
Básica Anual - 1 Sitio
120,00 U$D / año

marzo 27, 2025	marzo 27, 2026

INVERSIONES CAHERSI MOTOR´S, C.A.
J406785776
CALLE LEONCIO MARTÍNEZ QTA ALICIA URB LAS ACACIAS CARACAS DISTRITO CAPITAL, Venezuela
+582126343737
inversionescahersi@gmail.com

f38468c4-7f3e-44c6-a507-30ad0dad5ded
#####################
#4271 por MATIAS WENDLER CORONEL
Básica Semestral - 1 Sitio
51,72 U$D cada 6 meses

marzo 27, 2025	septiembre 27, 2025

MATIAS WENDLER CORONEL
Argentina
wendlerwebsolutions@gmail.com

2af499b4-3e51-4b34-92a2-ba69984dbdc6
#####################
#4266 por PINTURERIA A&M, C.A
Básica - 1 Sitio
12,00 U$D / mes

marzo 25, 2025	junio 30, 2025

PINTURERIA A&M, C.A
J500120028
AV MANUEL FELIPE TOVAR EDIF ESMERALDA SUITE PISO PB LOCAL SN URB SAN BERNARDINO CARACAS DISTRITO CAPITAL ZONA POSTAL 1010, Venezuela
+584125821224
tiendasmontanasanbernardino@gmail.com

12da5ad8-16a4-4410-9867-137af834e58c
#####################
#4255 por Stockin Lavanda
Básica Semestral - 1 Sitio
62,07 U$D cada 6 meses

marzo 20, 2025	septiembre 20, 2025

Argentina
ventasonline@stockinlavanda.com.ar

4dcdb23b-c9c0-4230-8864-6f8f6979e398
#####################
#4239 por Daniel Hernandez
Básica Anual - 1 Sitio
120,00 U$D / año

marzo 14, 2025	marzo 14, 2026

DANIEL JOSE HERNANDEZ RINCON
V12634136
Cafetal, Caracas, Venezuela
+584122606640
danieljhr1@gmail.com

abd1dc75-71e1-4d96-95db-0e1018a2ab60
#####################
#4232 por SOCIEDAD VENEZOLANA DE CARDIOLOGIA
Pro Anual - 3 Sitios
320,00 U$D / año

marzo 14, 2025	marzo 14, 2026

SOCIEDAD VENEZOLANA DE CARDIOLOGIA
J001320075
Av. Mohedano con Calle Don Pedro Grases, Centro Gerencial Mohedano, Piso 4, Ofic. 4-D, La Castellana. Caracas. ZP 1060, Venezuela
+582122631534
administracion@svcardiologia.com

ec1c477b-d5f2-4e13-a3a8-3af40c0baeb5
ec1c477b-d5f2-4e13-a3a8-3af40c0baeb6
ec1c477b-d5f2-4e13-a3a8-3af40c0baeb7
#####################
#4226 por Javier Chirinos
Básica - 1 Sitio
12,00 U$D / mes

marzo 12, 2025	junio 15, 2025

WILMAN JAVIER CHIRINOS PINO
V13059584
ARAGUA, GIRARDOT, LOS TACARIGUAS, Venezuela
+584124457158
tutrabajodegrado1@gmail.com
	
9df0411b-4df0-455a-9103-c6b8113a70d5
#####################
#4165 por SOCIEDAD VENEZOLANA DE CARDIOLOGIA
Membresía - Básica Anual - 1 Sitio
120,00 U$D / año

febrero 27, 2025	febrero 27, 2026

SOCIEDAD VENEZOLANA DE CARDIOLOGIA
J001320075
Av. Mohedano con Calle Don Pedro Grases, Centro Gerencial Mohedano, Piso 4, Ofic. 4-D, La Castellana. Caracas. ZP 1060, Venezuela
+582122631534
administracion@svcardiologia.com
	
9932ff69-ae5e-499b-bd53-dc864f22531c
#####################
#4131 por FRANCO CAIMI
Membresía - Básica Semestral - 1 Sitio
51,72 U$D cada 6 meses

febrero 17, 2025	agosto 17, 2025

FRANCO CAIMI
Argentina
franco_caimi@hotmail.com

87a75f5e-f2d6-45fb-b3d5-091f2fa40ff5
#####################
#4070 por Sergio Riebra
Membresía - Básica Semestral - 1 Sitio
60,00 U$D cada 6 meses

febrero 5, 2025	agosto 5, 2025

Sergio Riebra
16675837
Caracas, Venezuela
+584125967375
legalmenteconectadoscorp@gmail.com

41558a86-89d1-4bee-a541-e1dc0c7f71e0
#####################
#4027 por Martin Gutierrez
Membresía - Básica - 1 Sitio
10,34 U$D / mes

enero 24, 2025	junio 28, 2025

Argentina
martingutierrez08@gmail.com

b0935662-e35f-4001-a941-b84e0cd9dba8
#####################
#3962 por PPH Sa
Membresía - Básica Semestral - 1 Sitio
51,72 U$D cada 6 meses

enero 3, 2025	julio 3, 2025

PPH sa
Argentina
leandropadulo@hotmail.com

725b12c2-f416-4a3a-92d7-a71dde49c2d5
#####################
#3906 por Dalmiro José Yarza Montes
Membresía - Básica Semestral - 1 Sitio
60,00 U$D cada 6 meses

diciembre 18, 2024	noviembre 18, 2025

Dalmiro José Yarza Montes
V12077898
urbanizacion la esmeralda, calle 2 numero 18 San felipe Yaracuy
dalmirojy@gmail.com
+584128431894
	
bb101a68-fdb3-446c-a5e6-c5d8a8fef35f
#####################
#3866 por Angel David
Membresía - Básica - 1 Sitio
12,00 U$D / mes

diciembre 9, 2024	2025-06-10

Angel david
30160816
Caracas, Venezuela
+584243373387
angeldfp2004@gmail.com

63fe76e5-d11b-4f84-b135-6f2e0bdde1ff
#####################
#3834 por Lucas Bertotti
Membresía - Básica Anual - 1 Sitio
103,45 U$D / año

noviembre 29, 2024	noviembre 29, 2025

Argentina
sistemas@tp3d.com.ar

c67317f5-2d41-4643-99c6-daa678c5caa5
#####################
#3818 por CIRUGIAS LA NACIONAL C.A
Membership - Básica Anual - 1 Sitio
120,00 U$D / año

noviembre 27, 2024	noviembre 27, 2025

CIRUGIAS LA NACIONAL C.A
J400245192
AV BOLIVAR SUR FRENTE A LA ESTACION METRO MICHELENA VALENCIA EDO CARABOBO, Venezuela
+584144713093
jairoferia7@hotmail.com
	
a1864f4a-7646-463c-8142-6416cd80b8c9
#####################
#3804 por Pablo López
Membresía - Básica Semestral - 1 Sitio
51,72 U$D cada 6 meses

noviembre 25, 2024	noviembre 25, 2025

Argentina
lopezpablodaniel@gmail.com

9eecae4a-80d3-4eec-aa2e-a09013dd8107
#####################
#3705 por Nicolas Caso
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

octubre 31, 2024	octubre 31, 2025

Argentina
caso.nico@hotmail.com
	
051787bb-f836-4334-955b-30b436daa272
#####################
#3668 por MARIO FERNANDEZ CALLE
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

octubre 25, 2024	octubre 25, 2025

Bolivia
mariosuperbit@gmail.com

bbc7f17d-c869-435a-bdcb-07afbf6294ee
#####################
#3643 por Carlos Bermudez
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

octubre 20, 2024	octubre 20, 2025

Carlos Bermudez
Caracas
16135650
+584141329106
mipodcast.live@gmail.com
	
1bcf7d5d-9042-4a27-a3b1-9ea3fb407f00
#####################
#3570 por Miguel Ramon Duarte Prieto
Membresía - Básica - 1 Sitio
5,17 U$D / mes

octubre 11, 2024	En 20 horas

Miguel Ramon Duarte Prieto
Paraguay
miguelpy21@gmail.com

f3443f0d-2373-44c4-be0f-164be11a0997
#####################
#3565 por Luis Katz
Membresía - Básica - 1 Sitio
31,02 U$D cada 6 meses

octubre 11, 2024	2025-06-12

Luis Katz
Argentina:
guillermoarielkatz@gmail.com

5929a9c0-60dd-4dd0-b06f-3bef5a366c01
#####################
#3551 por Andry Reyes
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

octubre 9, 2024	diciembre 9, 2025

andry reyes
4978965
Caracas
+584129490569
assaxve@gmail.com

d274dd2a-5bdc-48db-86e9-e69040de94be
#####################
#3536 por Fabrizio Robbio
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

octubre 9, 2024	octubre 9, 2025

Fabrizio Robbio
Chile
admin@moldesunicose.com

cbb5bbb7-dbd1-499c-9991-8027fd9e3104
#####################
#3514 por Jonathan Bitriago
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

octubre 2, 2024	octubre 2, 2025

Jonathan Bitriago
21139440
Urbanización Club Hipico Las Trinitarias, Barquisimeto 3001, Venezuela., Venezuela
+584121734028
owlsunityagency@gmail.com

d3e2d3e5-8eb0-4f77-a3f2-3a19246929ab
#####################
#3499 por Daniel Sanchez
Membership - Básica Anual - 1 Sitio
66,00 U$D / año

septiembre 30, 2024	septiembre 30, 2025

Daniel Sanchez
23724136
Av las americas Res puerta de hierro, Venezuela
+584121234567
sanchedale@gmail.com
	
29ea627b-6db0-46fb-9628-a5069f738e5c
#####################
#3477 por LUCIANO LIVETTI
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

septiembre 24, 2024	septiembre 24, 2025

LUCIANO LIVETTI
Argentina
laquinta.medios@gmail.com
	
b73f8df3-bfbb-46cf-ae71-91ce87ed3261
#####################
#3461 por Wendy Rojas
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

septiembre 20, 2024	septiembre 20, 2025

Wendy Rojas
31334380
Caracas
+582125961220
TVNOVEDADESVE@GMAIL.COM
		
8e184bc5-b17c-42df-a867-71fcb4efe899
#####################
#3426 por Juan Agustin Traverso
Membresía - Básica - 1 Sitio
5,17 U$D / mes

septiembre 10, 2024	junio 15, 2025

Juan Agustin Traverso
Argentina
info@lavaindumentaria.com.ar

25b2dc1c-c309-47f9-8338-f689937f52ef
#####################
#3422 por Jonathan Bitriago
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

septiembre 10, 2024	septiembre 10, 2025

Jonathan Bitriago
21139440
Urbanización Club Hipico Las Trinitarias, Barquisimeto 3001, Venezuela., Venezuela
+584121734028
owlsunityagency@gmail.com
	
e2c92216-1d27-445a-bc54-4a882d273a7d
#####################
#3390 por Joel Amén
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

septiembre 2, 2024	septiembre 2, 2025

Joel Amén
Argentina
tiempoesmemoria@gmail.com

503e2e09-b0d9-4ae3-841c-dce26aa9750c
#####################
#3380 por SEGUCALL DIGITAL, C.A.
Plan Especial - Ventana Digital - 25 sitios
116,00 U$D cada 1 mes

agosto 28, 2024	agosto 28, 2030

SEGUCALL DIGITAL, C.A.
J501928517
AV SUR CC CENTRO EMPRESARIAL LAGUNITA NIVEL 4 OF. 407, URB LA LAGUNITA, CARACAS, Venezuela
+584242521880
administracion@ventana.digital

49560b50-1596-4a2f-8623-8c586e57e600
49560b50-1596-4a2f-8623-8c586e57e601
49560b50-1596-4a2f-8623-8c586e57e602    
49560b50-1596-4a2f-8623-8c586e57e603
49560b50-1596-4a2f-8623-8c586e57e604
49560b50-1596-4a2f-8623-8c586e57e605
49560b50-1596-4a2f-8623-8c586e57e606
49560b50-1596-4a2f-8623-8c586e57e607
49560b50-1596-4a2f-8623-8c586e57e608
49560b50-1596-4a2f-8623-8c586e57e609
49560b50-1596-4a2f-8623-8c586e57e610
49560b50-1596-4a2f-8623-8c586e57e611
49560b50-1596-4a2f-8623-8c586e57e612
49560b50-1596-4a2f-8623-8c586e57e613
49560b50-1596-4a2f-8623-8c586e57e614
49560b50-1596-4a2f-8623-8c586e57e615
49560b50-1596-4a2f-8623-8c586e57e616
49560b50-1596-4a2f-8623-8c586e57e617
49560b50-1596-4a2f-8623-8c586e57e618
49560b50-1596-4a2f-8623-8c586e57e619
49560b50-1596-4a2f-8623-8c586e57e620
49560b50-1596-4a2f-8623-8c586e57e621
49560b50-1596-4a2f-8623-8c586e57e622
49560b50-1596-4a2f-8623-8c586e57e623
49560b50-1596-4a2f-8623-8c586e57e624
49560b50-1596-4a2f-8623-8c586e57e625
#####################
#3379 por Julio Peñaloza
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

agosto 28, 2024	agosto 28, 2025

Julio Peñaloza
27938006
Portuguesa, Venezuela
+584120557754
xerographics1999@hotmail.com

280b8d4d-ba8c-4ffb-9f99-a128a0c7af8a
#####################
#3370 por Hector Osorio
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

agosto 27, 2024	agosto 27, 2025

hector osorio
24903603
Carabobo, Venezuela
+584147114220
ganaconmodaurbana@gmail.com

	
a056b927-4b0d-4ced-afe3-edf7856d9c41
#####################
#3332 por Sercoinfal C.A. 
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

agosto 22, 2024	agosto 22, 2025

Sercoinfal C.A. 
J305910553
Av. ppal Local Industrial Terranostra parcela nro. L-35 Urb. Parque Comercio Industrial Castillito, San Diego 2006, Carabobo, Valencia, Venezuela
+584144206511
hmedina@sercoinfal.com

b1696a43-d9ab-4789-afa3-023ce95d1269	
#####################
#3326 por MOISES FRIDZON
Membership - Básica Anual - 1 Sitio
66,00 U$D / año

agosto 21, 2024	agosto 21, 2025

mfridzon@opticacaroni.com
MOISES FRIDZON
1097449
Caracas, Venezuela
+584242500970

747f7cb5-2eda-41b7-b77f-935322dfbede
#####################
#3322 por Estación El Consejo S.A
Membership - Básica Anual - 1 Sitio
66,00 U$D / año

agosto 21, 2024	agosto 21, 2025

Estación El Consejo S.A
J075601840
Carretera Panamericana Hacienda Santa Teresa, El Consejo Estado Aragua, Venezuela
+584144532331
jtirado@ronsantateresa.com

43402eb3-69b5-4a29-ae12-1d6f3cd98463
#####################
#3319 por Julio Peñaloza
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

agosto 18, 2024	agosto 18, 2025


Julio Peñaloza
27938006
Portuguesa, Venezuela
+584120557754
xerographics1999@hotmail.com

2b4a486e-59c6-4af9-8ffb-d05bec320271
#####################
#3313 por Jhonny Rea
Membresía - Básica - 1 Sitio
72,00 U$D / mes

agosto 14, 2024	diciembre 12, 2025

Jhonny Rea
18622519
La Candelaria, Caracas, Venezuela
+584127136957
jhonnyrea2010@hotmail.com

3daf40eb-224a-4bc2-a09f-e7b955f924ab
#####################
#3299 por Carlos Luna
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

agosto 9, 2024	agosto 9, 2025

México
espeacke@gmail.com

	
ae4f4d85-be52-4874-9dd8-a33faff5fa2c
#####################
#3288 por Gaston Valerio
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

agosto 6, 2024	agosto 6, 2025

Argentina
gvalerio@trv.com.ar

5636b191-e70c-4ad1-817f-43cecb66503e
#####################
#3207 por Diaz Gabriel Alejandro
Membership - Básica Anual - 1 Sitio
56,90 U$D / año

julio 18, 2024	julio 18, 2025

Diaz Gabriel Alejandro
Argentina
gabriel@rpdigital.com.ar
	
4fe1dc4e-80d3-4f02-9fe1-8da8971769f8
#####################
#3205 por Carlos Luna
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

julio 18, 2024	julio 18, 2025

Carlos Luna
México
espeacke@gmail.com

6f57f3d1-a1d3-40e6-b872-50f3973bcd4f
#####################
#3198 por Now de Venezuela CA 
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

julio 17, 2024	julio 17, 2025
Now de Venezuela CA 
J305766479
Av 3H con Calle 80 #80-05 Local 1 y 2, Maracaibo, Zulia, Venezuela
+584121234567
sistemas@nowdevenezuela.com

a70a7f05-2a13-4f73-804b-7a420a687cd0
#####################
#3195 por Pablo Toledo
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

julio 16, 2024	julio 16, 2025

Pablo Toledo
Argentina
Administracion3@starligh.com

58679094-c3a4-4eb0-bd2c-a5a71538bc79
#####################
#3192 por Leonardo Mariño
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

julio 16, 2024	julio 16, 2025

Leonardo Mariño
Argentina
mktleomarino@gmail.com

c459fdc5-7b91-4326-b531-955c1e28ff4b
#####################
#3184 por Jose Primavera
Membership - Básica - 1 Sitio
6,00 U$D / mes

julio 15, 2024	junio 16, 2025

jose primavera
v12761486
subida de oripoto con calle tamanaco cruze con tusmare urb. tusmare casa primavera, Venezuela
+584142071207
miguelprimavera1@gmail.com

1cfb923e-c6fa-4823-a151-3cef9815d7d1
#####################
#3178 por Alaing Maldonado
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

julio 11, 2024	julio 11, 2025

Alaing Maldonado
19961966
Caracas
+584123311226
alaingmaldonado@somosdecopaint.com

ca103547-41c7-445b-a4bc-4578a2a4d534
#####################
#3158 por Nicolas Salazar
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

julio 8, 2024	julio 8, 2025

Nicolas Salazar
Chile
ventas@onehostchile.cl

5a7751ed-fa82-42c6-9202-6d0065fb1c76
#####################
#3133 por Paula MARTINEZ
Membresía - Básica - 1 Sitio
5,17 U$D / mes

julio 4, 2024	julio 6, 2025

Paula MARTINEZ
Argentina
pmartineznf@gmail.com

4131dd8e-5294-43a1-976e-b89858187d8b
#####################
#3112 por Eugenio Cesar Oliden
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

julio 1, 2024	julio 1, 2025

Eugenio Cesar Oliden
España
ecoliden@gmail.com

9c00886f-0026-4d17-a230-ddb06983225d
#####################
#3067 por Hancho Issa
Membresía - Pro - 3 Sitios
15,00 U$D / mes

junio 25, 2024	junio 16, 2025

Hancho Issa
445451
Caracas, Venezuela
+584241616368
hancho.issa@gmail.com

2bf6475c-fcc0-49cb-8a5e-1ec9f7b073ae
2bf6475c-fcc0-49cb-8a5e-1ec9f7b073a2
2bf6475c-fcc0-49cb-8a5e-1ec9f7b073a3
#####################
#2949 por Keisy Pérez
Membresía - Básica - 1 Sitio
6,00 U$D / mes

mayo 28, 2024	12 de junio de 2025

KEISY YUDITH PEREZ CORREA
V16045183
GUARICO, ROSCIO, SAN JUAN DE LOS MORROS, Venezuela
+584120342306
marketingdkp40@gmail.com
	
23ed274b-d1e0-4396-988b-a1ec0771b8b4
#####################
#2847 por Jesus De la rosa
Membresía - Básica - 1 Sitio
5,17 U$D / mes

mayo 10, 2024	junio 15, 2025

Jesus De la rosa
República Dominicana
over20233@gmail.com

40cc73ff-b207-4fac-8da4-54c8fcf7a204
#####################
#2779 por HSIU HUANG
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

mayo 6, 2024	mayo 6, 2026

HSIU HUANG
Argentina
point.app@modapoint.com.ar
	
56ba04ae-d886-471e-98f2-41a7ef310db6
#####################
#2735 por Jonathan Bitriago
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

abril 25, 2024	abril 28, 2026

Jonathan Bitriago
21139440
Urbanización Club Hipico Las Trinitarias, Barquisimeto 3001, Venezuela., Venezuela
+584121734028
owlsunityagency@gmail.com
	
04192638-8aaf-4b08-a8ff-bf977643b9b7
#####################
#2622 por Facundo Martin Pieroni
Membresía - Básica - 1 Sitio
5,17 U$D / mes

abril 2, 2024	agosto 8, 2025

Facundo Martin Pieroni
Argentina
facundoante@hotmail.com

6bda278c-2714-497b-b415-6dbdb4f323d3
#####################
#2454 por JESUS ROJAS
Membresía - Básica Anual - 1 Sitio
56,90 U$D / año

marzo 7, 2024	marzo 7, 2026
JESUS ROJAS
Estados Unidos (EEUU)
jrojas@iocagroup.com

8316b81e-98d8-403e-a791-8a133472e008
#####################
#2402 por Isabel Bermudez
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

febrero 28, 2024	marzo 2, 2026

Isabel Bermudez
17705397
Calle D, Qta Loly, Las Marias, El Hatillo, Caracas, Venezuela
+584141365257
isabermudezfebres@gmail.com

87be0385-6a71-4fdb-980f-d71828d76fbd
#####################
#2263 por Liam Fung
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

febrero 5, 2024	febrero 5, 2026

Liam Fung
29856925
mañongo valencia Carabobo, Venezuela
+584125052777
carovastore@gmail.com

f2a05b86-5d8e-4f51-8bc6-6f0ff5498a80
#####################
#2167 por John David Ferreira Dos Santos
Membresía - Básica - 1 Sitio
6,00 U$D / mes

enero 19, 2024	junio 30, 2025

JOHN DAVID FERREIRA DOS SANTOS
V11742654
MIRANDA, BARUTA, Venezuela
+584241925476
j18d11fs77@gmail.com

52182e69-283f-4186-8497-b46432659f33
#####################
#1820 por Karla Patricia Perez Leon
Membresía - Básica Anual - 1 Sitio
66,00 U$D / año

noviembre 29, 2023	enero 15, 2026

Karla Patricia Perez Leon
El Salvador
kperezleon@gmail.com
	
f12f6855-913f-4690-949d-3c4546b2d334

*/