import express from 'express';
import cors from 'cors';
import path from 'path';
import fetch from "node-fetch";
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

if (fs.existsSync('.env')) {
  dotenv.config();
} else if (fs.existsSync('.env.example')) {
  dotenv.config({ path: '.env.example' });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const openAiApiKey = process.env.OPENAI_API_KEY || "";
const openAiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";






























let valenbisiStations = [];
let taxiStations = []; 
let stationUsage;
let stationBusUsage;
let stationRodaliaUsage;
// Clave de Google Maps obtenida de la variable de entorno
const apiKey = process.env.GOOGLE_MAPS_API_KEY || "";
const router = express.Router();
app.use(cors());
app.use(express.json()); // Asegura que el body se maneje como JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para proporcionar la clave de Google Maps al cliente
app.get('/api/google-maps-key', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({ apiKey });
});
// Ruta de prueba
app.get('/api/getBicis', (req, res) => {
	res.setHeader("Content-Type", "application/json");
    res.json(valenbisiStations);
});

app.get('/api/getTaxis', (req, res) => {
	res.setHeader("Content-Type", "application/json");
    res.json(taxiStations);
});

app.get('/api/getMetro', (req, res) => {
	res.setHeader("Content-Type", "application/json");
    res.json(stationUsage);
});

app.get('/api/getBus', (req, res) => {
	res.setHeader("Content-Type", "application/json");
    res.json(stationBusUsage);
});

app.get('/api/getRodalia', (req, res) => {
	res.setHeader("Content-Type", "application/json");
    res.json(stationRodaliaUsage);
});


app.get('/api/buscaEstacionTaxi', async (req, res) => {
	res.setHeader("Content-Type", "application/json");
    
	const Olat = parseFloat(req.query.Olat);
	const Olng = parseFloat(req.query.Olng);
	const Dlat = parseFloat(req.query.Dlat);
	const Dlng = parseFloat(req.query.Dlng);
	const pointA = { lat: Olat, lng: Olng };
	const pointB = { lat: Dlat, lng: Dlng };	
	
	if (isNaN(Olat) || isNaN(Olng) || isNaN(Dlat) || isNaN(Dlng)) {
	    return res.status(400).json({ error: "Parámetros lat y lng inválidos" });
	}
	
	const bestStationO = await findNearestTaxiStation(pointA);
	
	const url1 = `https://maps.googleapis.com/maps/api/directions/json?origin=${Olat},${Olng}&destination=${bestStationO.lat},${bestStationO.lng}&mode=walking&key=${apiKey}`;
	const url2 = `https://maps.googleapis.com/maps/api/directions/json?origin=${bestStationO.lat},${bestStationO.lng}&destination=${pointB.lat},${pointB.lng}&mode=DRIVING&key=${apiKey}`;
	       
	console.log("del metodo: " + bestStationO);
	
	const [response1, response2] = await Promise.all([
	    fetch(url1).then(res => res.json()),
	    fetch(url2).then(res => res.json())
	]);
	
	if (response1.status !== "OK" || response2.status !== "OK") {
	    return res.status(500).json({ error: "Error en la API de Google Maps", details: { response1, response2 } });
	}
	
	res.json({
	           walkingToStation: response1,
	           taxi: response2,
	         
	       });
});


app.get('/api/buscaEstacionBici', async (req, res) => {
    // Extraer parámetros de la query
	res.setHeader("Content-Type", "application/json");
    const Olat = parseFloat(req.query.Olat);
    const Olng = parseFloat(req.query.Olng);
    const Dlat = parseFloat(req.query.Dlat);
    const Dlng = parseFloat(req.query.Dlng);
    const ignoreAviabilityO = parseInt(req.query.ignoreAviabilityO) || 0;
    const ignoreAviabilityD = parseInt(req.query.ignoreAviabilityD) || 0;

    // Validación de parámetros
    if (isNaN(Olat) || isNaN(Olng) || isNaN(Dlat) || isNaN(Dlng)) {
        return res.status(400).json({ error: "Parámetros lat y lng inválidos" });
    }

    const pointA = { lat: Olat, lng: Olng };
    const pointB = { lat: Dlat, lng: Dlng };

    try {
        // Buscar estaciones más cercanas
        const bestStationO = await findNearestBikeStation(pointA, ignoreAviabilityO);
        const bestStationD = await findNearestBikeStation(pointB, ignoreAviabilityD);

        if (!bestStationO || !bestStationD) {
            return res.status(404).json({ error: "No se encontró ninguna estación cercana" });
        }

        // Construcción de URLs para Google Maps API

        const url1 = `https://maps.googleapis.com/maps/api/directions/json?origin=${Olat},${Olng}&destination=${bestStationO.lat},${bestStationO.lng}&mode=walking&key=${apiKey}`;
        const url2 = `https://maps.googleapis.com/maps/api/directions/json?origin=${bestStationO.lat},${bestStationO.lng}&destination=${bestStationD.lat},${bestStationD.lng}&mode=bicycling&key=${apiKey}`;
        const url3 = `https://maps.googleapis.com/maps/api/directions/json?origin=${bestStationD.lat},${bestStationD.lng}&destination=${Dlat},${Dlng}&mode=walking&key=${apiKey}`;

        // Peticiones a Google Maps API
        const [response1, response2, response3] = await Promise.all([
            fetch(url1).then(res => res.json()),
            fetch(url2).then(res => res.json()),
            fetch(url3).then(res => res.json())
        ]);

        // Verificación de errores en la API de Google Maps
        if (response1.status !== "OK" || response2.status !== "OK" || response3.status !== "OK") {
            return res.status(500).json({ error: "Error en la API de Google Maps", details: { response1, response2, response3 } });
        }

        // Responder con todas las rutas obtenidas
        res.json({
            walkingToStation: response1,
            bikingRoute: response2,
            walkingFromStation: response3
        });

    } catch (error) {
        console.error("Error en la búsqueda de estación:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});




app.get("/rutaTansPub", async (req, res) => {
	res.setHeader("Content-Type", "application/json");
    try {
        const oLat = parseFloat(req.query.oLat);
        const oLng = parseFloat(req.query.oLng);
        const dLat = parseFloat(req.query.dLat);
		const dLng = parseFloat(req.query.dLng);
		const TM =req.query.tm;

        if (!oLat || !oLng || !dLat || !dLng) {
            return res.status(400).json({ error: "Parámetros lat y lng son requeridos" });
        }

        const url = "https://maps.googleapis.com/maps/api/directions/json?origin=" + oLat + "," +oLng+"&destination="+dLat+","+dLng +"&mode=transit&transit_mode="+TM+"&key="+apiKey;
	
		
        console.log("Llamando a Google Maps API con URL:", url);

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== "OK") {
            return res.status(500).json({ error: "Error en la API de Google Maps", details: data });
        }

        res.json(data);
    } catch (error) {
        console.error("Error al obtener la ruta:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.get("/rutaTransportTipical", async (req, res) => {
	res.setHeader("Content-Type", "application/json");
    try {
        const oLat = parseFloat(req.query.oLat);
        const oLng = parseFloat(req.query.oLng);
        const dLat = parseFloat(req.query.dLat);
        const dLng = parseFloat(req.query.dLng);
        const mode = req.query.mode;

        if (!oLat || !oLng || !dLat || !dLng || !mode) {
            return res.status(400).json({ error: "Parámetros lat, lng y mode son requeridos" });
        }

       

        const params = new URLSearchParams({
            origin: `${oLat},${oLng}`,
            destination: `${dLat},${dLng}`,
            mode: mode,
            key: apiKey
        });

        const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== "OK") {
            return res.status(500).json({ error: "Error en la API de Google Maps", details: data });
        }

        res.json(data);
    } catch (error) {
        console.error("Error al obtener la ruta:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});


app.get("/rutaMotoElectrica", async (req, res) => {
	res.setHeader("Content-Type", "application/json");
    try {
        const oLat = parseFloat(req.query.oLat);
        const oLng = parseFloat(req.query.oLng);
        const dLat = parseFloat(req.query.dLat);
        const dLng = parseFloat(req.query.dLng);
        const mode = req.query.mode;

        if (!oLat || !oLng || !dLat || !dLng || !mode) {
            return res.status(400).json({ error: "Parámetros lat, lng y mode son requeridos" });
        }

       

        const params = new URLSearchParams({
            origin: `${oLat},${oLng}`,
            destination: `${dLat},${dLng}`,
            mode: mode,
            key: apiKey,
			avoid: "tolls|highways"
        });

        const url = `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== "OK") {
            return res.status(500).json({ error: "Error en la API de Google Maps", details: data });
        }

        res.json(data);
    } catch (error) {
        console.error("Error al obtener la ruta:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

app.post('/api/recommend-transport', async (req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (!openAiApiKey) {
        return res.status(503).json({
            error: 'OPENAI_API_KEY no configurada en el servidor. Añádela en tu archivo .env.'
        });
    }

    const rawCandidates = Array.isArray(req.body?.candidates) ? req.body.candidates : [];
    const userContext = typeof req.body?.context === 'string' ? req.body.context.trim() : '';
    const languageRaw = typeof req.body?.language === 'string' ? req.body.language.trim().toLowerCase() : 'es';
    const responseLanguage = ['es', 'en', 'val'].includes(languageRaw) ? languageRaw : 'es';
    const candidates = rawCandidates
        .filter(candidate => candidate && !candidate.error && Number.isFinite(candidate.totalDistance) && Number.isFinite(candidate.totalTime))
        .map(candidate => ({
            mode: candidate.mode,
            totalDistance: candidate.totalDistance,
            totalTime: candidate.totalTime,
            co2: Number.isFinite(candidate.co2) ? candidate.co2 : 0
        }));

    if (candidates.length === 0) {
        return res.status(400).json({ error: 'No hay candidatas válidas para recomendar.' });
    }

    const userPrompt = {
        ciudad: 'Valencia',
        contextoUsuario: userContext || 'Sin contexto adicional',
        candidatos: candidates
    };


    const minMax = (values) => ({ min: Math.min(...values), max: Math.max(...values) });
    const normalize = (value, min, max) => (max === min ? 0 : (value - min) / (max - min));
    const isUnrealisticActiveMode = (candidate) => {
        if (!candidate) return false;
        if (candidate.mode === 'WALKING' && candidate.totalDistance > 10000) return true;
        if (['BICYCLING', 'Valenbisi', 'PATINETE'].includes(candidate.mode) && candidate.totalDistance > 15000) return true;
        return false;
    };

    const pickRecommendedCandidate = () => {
        const realisticCandidates = candidates.filter(candidate => !isUnrealisticActiveMode(candidate));
        const pool = realisticCandidates.length > 0 ? realisticCandidates : candidates;

        const co2Range = minMax(pool.map(candidate => candidate.co2));
        const timeRange = minMax(pool.map(candidate => candidate.totalTime));
        const distanceRange = minMax(pool.map(candidate => candidate.totalDistance));

        const minCo2 = Math.min(...pool.map(candidate => candidate.co2));
        const minTime = Math.min(...pool.map(candidate => candidate.totalTime));
        const minDistance = Math.min(...pool.map(candidate => candidate.totalDistance));

        const scored = pool
            .map(candidate => {
                const co2Norm = normalize(candidate.co2, co2Range.min, co2Range.max);
                const timeNorm = normalize(candidate.totalTime, timeRange.min, timeRange.max);
                const distanceNorm = normalize(candidate.totalDistance, distanceRange.min, distanceRange.max);

                let score = (co2Norm * 0.55) + (timeNorm * 0.35) + (distanceNorm * 0.10);

                if (candidate.co2 === minCo2) score -= 0.12;
                if (candidate.totalTime === minTime) score -= 0.08;
                if (candidate.totalDistance === minDistance) score -= 0.04;

                const isEcoMode = ['WALKING', 'BICYCLING', 'PATINETE', 'Valenbisi'].includes(candidate.mode);
                if (isEcoMode && candidate.totalTime <= (minTime * 1.35)) {
                    score -= 0.05;
                }

                const isMicromobilityMode = ['BICYCLING', 'Valenbisi', 'PATINETE'].includes(candidate.mode);
                if (isMicromobilityMode) {
                    if (candidate.totalDistance > 13000) {
                        score += 0.50;
                    } else if (candidate.totalDistance > 10000) {
                        score += 0.30;
                    } else if (candidate.totalDistance > 7000) {
                        score += 0.16;
                    } else if (candidate.totalDistance > 6000) {
                        score += 0.08;
                    }
                }

                return { candidate, score };
            })
            .sort((a, b) => a.score - b.score);

        return scored[0]?.candidate || pool[0] || candidates[0];
    };


    const buildFallbackReason = (recommendedCandidate) => {
        if (responseLanguage === 'en') {
            return `I could not generate a dynamic AI explanation right now. The calculated recommended mode is ${recommendedCandidate.mode}.`;
        }
        if (responseLanguage === 'val') {
            return `No he pogut generar una explicació dinàmica d'IA ara mateix. El mode recomanat calculat és ${recommendedCandidate.mode}.`;
        }
        return `No he podido generar una explicación dinámica de IA en este momento. El modo recomendado calculado es ${recommendedCandidate.mode}.`;
    };

    try {
        const recommendedCandidate = pickRecommendedCandidate();
        const recommendedMode = recommendedCandidate.mode;
        const bestByTime = [...candidates].sort((a, b) => a.totalTime - b.totalTime)[0];
        const bestByCo2 = [...candidates].sort((a, b) => a.co2 - b.co2)[0];
        const bestByDistance = [...candidates].sort((a, b) => a.totalDistance - b.totalDistance)[0];
        const publicTransportModes = ['BUS', 'METRO', 'TRAIN'];
        const publicTransportCandidates = candidates.filter(candidate => publicTransportModes.includes(candidate.mode));
        const bestPublicTransport = publicTransportCandidates.length
            ? [...publicTransportCandidates].sort((a, b) => {
                if (a.co2 !== b.co2) return a.co2 - b.co2;
                if (a.totalTime !== b.totalTime) return a.totalTime - b.totalTime;
                return a.totalDistance - b.totalDistance;
            })[0]
            : null;

        let reason = '';

        try {
            const labelByMode = {
                WALKING: responseLanguage === 'en' ? 'Walking' : responseLanguage === 'val' ? 'A peu' : 'Andando',
                BICYCLING: responseLanguage === 'en' ? 'Bicycle' : responseLanguage === 'val' ? 'Bicicleta' : 'Bicicleta',
                DRIVING: responseLanguage === 'en' ? 'Car' : responseLanguage === 'val' ? 'Cotxe' : 'Coche',
                Valenbisi: 'Valenbisi',
                PATINETE: responseLanguage === 'en' ? 'Scooter' : responseLanguage === 'val' ? 'Patinet' : 'Patinete',
                METRO: 'Metro',
                BUS: responseLanguage === 'en' ? 'Bus' : responseLanguage === 'val' ? 'Autobús' : 'Autobús',
                TRAIN: responseLanguage === 'en' ? 'Train' : responseLanguage === 'val' ? 'Tren' : 'Tren',
                TAXI: 'Taxi',
                Taxi: 'Taxi',
                ELECTRIC_CAR: responseLanguage === 'en' ? 'Electric car' : responseLanguage === 'val' ? 'Cotxe elèctric' : 'Coche eléctrico',
                DIESEL_CAR: responseLanguage === 'en' ? 'Diesel car' : responseLanguage === 'val' ? 'Cotxe dièsel' : 'Coche diésel',
                GASOLINE_CAR: responseLanguage === 'en' ? 'Gasoline car' : responseLanguage === 'val' ? 'Cotxe gasolina' : 'Coche gasolina',
                COCHE_HIBRIDO: responseLanguage === 'en' ? 'Hybrid car' : responseLanguage === 'val' ? 'Cotxe híbrid' : 'Coche híbrido',
                COCHE_DE_HIDROGENO: responseLanguage === 'en' ? 'Hydrogen car' : responseLanguage === 'val' ? "Cotxe d'hidrogen" : 'Coche de hidrógeno',
                CAMION: responseLanguage === 'en' ? 'Truck' : responseLanguage === 'val' ? 'Camió' : 'Camión',
                COMBUSTION_MOTORBIKE: responseLanguage === 'en' ? 'Combustion motorbike' : responseLanguage === 'val' ? 'Moto de combustió' : 'Moto de combustión',
                ELECTRIC_MOTORBIKE: responseLanguage === 'en' ? 'Electric motorbike' : responseLanguage === 'val' ? 'Moto elèctrica' : 'Moto eléctrica',
                CICLOMOTOR: responseLanguage === 'en' ? 'Moped' : responseLanguage === 'val' ? 'Ciclomotor' : 'Ciclomotor'
            };

            const toLabeledCandidate = (candidate) => ({
                ...candidate,
                modeLabel: labelByMode[candidate.mode] || candidate.mode
            });

            const systemPrompt = `Eres un asistente experto en movilidad sostenible de Valencia. Tu objetivo es explicar una recomendación ya decidida, sin cambiarla.
Reglas:
1) Devuelve SOLO JSON válido con: {"reason":"explicación"}.
2) Debes defender el modo recomendado usando tiempo, distancia y CO2 exactos que recibes.
3) Haz una reflexión comparativa fiel a los datos exactos (tiempo, distancia y CO2) e indica empates reales cuando existan.
4) Evita plantillas rígidas o frases fijas; redacta una explicación natural y útil en máximo 4 frases.
5) No inventes datos ni afirmes que una opción es "la mejor" en un criterio si hay empate.
6) Responde estrictamente en este idioma: ${responseLanguage === 'en' ? 'English' : responseLanguage === 'val' ? 'valencià' : 'español'}.
7) Usa modeLabel para nombrar los modos cuando exista.
8) Nunca escribas el typo "BYCICLING".
9) Para rutas largas (más de 6-7 km), evita sobrepriorizar micromovilidad (bici, Valenbisi, patinete) salvo que los datos lo justifiquen claramente.
10) Cierra la explicación con una frase breve indicando si conviene transporte público y cuál sería la mejor alternativa de transporte público según los datos (si existe).`;

            const tieTolerance = 1e-9;
            const rankingTiempo = [...candidates]
                .sort((a, b) => a.totalTime - b.totalTime)
                .slice(0, 5)
                .map(candidate => ({ mode: candidate.mode, totalTime: candidate.totalTime, totalDistance: candidate.totalDistance, co2: candidate.co2 }));
            const rankingEmisiones = [...candidates]
                .sort((a, b) => a.co2 - b.co2)
                .slice(0, 5)
                .map(candidate => ({ mode: candidate.mode, totalTime: candidate.totalTime, totalDistance: candidate.totalDistance, co2: candidate.co2 }));
            const rankingDistancia = [...candidates]
                .sort((a, b) => a.totalDistance - b.totalDistance)
                .slice(0, 5)
                .map(candidate => ({ mode: candidate.mode, totalTime: candidate.totalTime, totalDistance: candidate.totalDistance, co2: candidate.co2 }));

            const empateTiempo = candidates
                .filter(candidate => Math.abs(candidate.totalTime - bestByTime.totalTime) <= tieTolerance)
                .map(candidate => candidate.mode);
            const empateEmisiones = candidates
                .filter(candidate => Math.abs(candidate.co2 - bestByCo2.co2) <= tieTolerance)
                .map(candidate => candidate.mode);
            const empateDistancia = candidates
                .filter(candidate => Math.abs(candidate.totalDistance - bestByDistance.totalDistance) <= tieTolerance)
                .map(candidate => candidate.mode);

            const explanationPrompt = {
                ...userPrompt,
                idiomaRespuesta: responseLanguage,
                modoRecomendadoFijo: toLabeledCandidate(recommendedCandidate),
                mejorTiempo: toLabeledCandidate(bestByTime),
                mejorEmisiones: toLabeledCandidate(bestByCo2),
                mejorDistancia: toLabeledCandidate(bestByDistance),
                rankingTiempo: rankingTiempo.map(toLabeledCandidate),
                rankingEmisiones: rankingEmisiones.map(toLabeledCandidate),
                rankingDistancia: rankingDistancia.map(toLabeledCandidate),
                mejorTransportePublico: bestPublicTransport ? toLabeledCandidate(bestPublicTransport) : null,
                empates: {
                    tiempo: empateTiempo.map(mode => ({ mode, modeLabel: labelByMode[mode] || mode })),
                    emisiones: empateEmisiones.map(mode => ({ mode, modeLabel: labelByMode[mode] || mode })),
                    distancia: empateDistancia.map(mode => ({ mode, modeLabel: labelByMode[mode] || mode }))
                }
            };


            const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${openAiApiKey}`
                },
                body: JSON.stringify({
                    model: openAiModel,
                    temperature: 0.7,
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: JSON.stringify(explanationPrompt) }
                    ]
                })
            });

            if (openAiResponse.ok) {
                const completion = await openAiResponse.json();
                const content = completion?.choices?.[0]?.message?.content;
                if (content) {
                    const parsed = JSON.parse(content);
                    if (parsed?.reason) {
                        reason = parsed.reason;
                    }
                }
            }
        } catch (error) {
            console.warn('No se pudo generar explicación con IA, usando fallback:', error.message);
        }

        if (typeof reason !== 'string') {
            reason = String(reason || '').trim();
        }

        if (!reason) {
            reason = buildFallbackReason(recommendedCandidate);
        }

        return res.json({ recommendedMode, reason, candidatesCount: candidates.length });
    } catch (error) {
        console.error('Error en /api/recommend-transport:', error);
        return res.status(500).json({ error: 'Error interno al recomendar transporte con IA.' });
    }
});







app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});





////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Carga de estaciones de bicicleta

////////////////////////////////////////////////////////////////////////////////////////////////////////////
function loadValenBisiStations(url) {
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.results) {
               // valenbisiStations = []; // Limpiar antes de cargar nuevas estaciones
                
                data.results.forEach(station => {
                    let lat = station.geo_point_2d.lat;
                    let lon = station.geo_point_2d.lon;
                    let address = station.address;
                    let available = station.available;
                    let total = station.total;

         
                    valenbisiStations.push({ lat, lon, address, available, total });
                });
            }
        })
        .catch(error => console.error("Error al cargar estaciones de Valenbisi:", error));
}

loadValenBisiStations("https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/valenbisi-disponibilitat-valenbisi-dsiponibilidad/records?limit=100");
loadValenBisiStations("https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/valenbisi-disponibilitat-valenbisi-dsiponibilidad/records?limit=100&offset=100");
loadValenBisiStations("https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/valenbisi-disponibilitat-valenbisi-dsiponibilidad/records?limit=73&offset=200");





////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Carga de estaciones de taxi

////////////////////////////////////////////////////////////////////////////////////////////////////////////


function loadTaxiStations(url) {
    return fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.results) {
               // valenbisiStations = []; // Limpiar antes de cargar nuevas estaciones
                
                data.results.forEach(station => {
                    let lat = station.geo_point_2d.lat;
                    let lon = station.geo_point_2d.lon;
                    let calle = station.calle;


         
                    taxiStations.push({ lat, lon, calle });
                });
            }
        })
        .catch(error => console.error("Error al cargar estaciones de Valenbisi:", error));
}

loadTaxiStations("https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/taxis/records?limit=100");
loadTaxiStations("https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/taxis/records?limit=100&offset=100");






////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Carga de estaciones de metro

////////////////////////////////////////////////////////////////////////////////////////////////////////////



async function fetchAndConcatMetroData() {
    const urlsMetro = [
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/fgv-estacions-estaciones/records?limit=100",
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/fgv-estacions-estaciones/records?limit=50&offset=100"
    ];

    const estacionesLinea1Extra = new Set([
        "València Sud", "Sant Isidre", "Safranar", "Patraix", "Jesús", "Pl. Espanya", "Àngel Guimerà",
        "Túria", "Campanar", "Beniferri", "Empalme"
    ]);

	const estacionesLinea7Extra = new Set([
	    "Marítim", "València Sud", "Sant Isidre", "Safranar", "Patraix", "Jesús"
	]);
	
	const estacionesLinea6Extra = new Set([
	    "Marítim"
	]);
	
	const estacionesLinea8Extra = new Set([
	    "Marítim"
	]);

    try {
        const responses = await Promise.all(urlsMetro.map(url => fetch(url)));
        const data = await Promise.all(responses.map(res => res.json()));
        let combinedResults = data[0].results.concat(data[1].results);

        combinedResults = combinedResults.map(estacion => {
            let lineas = estacion.linea.split(',').map(l => l.trim());

            if (estacionesLinea1Extra.has(estacion.nombre) && !lineas.includes("1")) {
                lineas.push("1");
            }

			if (estacionesLinea7Extra.has(estacion.nombre) && !lineas.includes("7")) {
			    lineas.push("7");
			}
			
			if (estacionesLinea6Extra.has(estacion.nombre) && !lineas.includes("6")) {
			    lineas.push("6");
			}
			
			if (estacionesLinea8Extra.has(estacion.nombre) && !lineas.includes("8")) {
			    lineas.push("8");
			}

            // Ordenar y actualizar la propiedad
            estacion.linea = lineas.sort().join(',');
            return estacion;
        });

        stationUsage = combinedResults;
    } catch (error) {
        console.error("Error al obtener los datos: ", error);
        stationUsage = [];
    }
}


async function fetchAndConcatBUSData() {
    const urlsBus = [
		"https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/emt/records?limit=100&offset=0",		        
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/emt/records?limit=100&offset=100",
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/emt/records?limit=100&offset=200",
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/emt/records?limit=100&offset=300",
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/emt/records?limit=100&offset=400",
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/emt/records?limit=100&offset=500",
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/emt/records?limit=100&offset=600",
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/emt/records?limit=100&offset=700",
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/emt/records?limit=100&offset=800",
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/emt/records?limit=100&offset=900",
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/emt/records?limit=100&offset=1000",
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/emt/records?limit=100&offset=1100"
    ];

    try {
        // Hacer las solicitudes en paralelo
        const responses = await Promise.all(urlsBus.map(url => fetch(url)));

        // Convertir las respuestas a JSON
        const data = await Promise.all(responses.map(res => res.json()));

        // Concatenar correctamente todos los resultados
        //stationBusUsage = data.flat();  // Si el JSON devuelve un array directamente
         stationBusUsage = data.map(d => d.results).flat();  // Si los datos vienen en `results`
        
    
    } catch (error) {
        console.error("Error al obtener los datos: ", error);
        stationBusUsage = [];
    }
}



async function fetchAndConcatRodaliaData() {
    const urlsRodalia = [
		"https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/estacions-rodalia-valencia-val/records?limit=100",		        
        "https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/estacions-rodalia-valencia-val/records?limit=100&offset=100"
    ];

    try {
        // Hacer las solicitudes en paralelo
        const responses = await Promise.all(urlsRodalia.map(url => fetch(url)));

        // Convertir las respuestas a JSON
        const data = await Promise.all(responses.map(res => res.json()));

        // Concatenar correctamente todos los resultados
        //stationBusUsage = data.flat();  // Si el JSON devuelve un array directamente
         stationRodaliaUsage = data.map(d => d.results).flat();  // Si los datos vienen en `results`
        
    
    } catch (error) {
        console.error("Error al obtener los datos: ", error);
        stationRodaliaUsage = [];
    }
}














    await fetchAndConcatMetroData();

    await fetchAndConcatBUSData();

	await fetchAndConcatRodaliaData();

		



		// Función para encontrar la mejor estación de bicis
		const findNearestBikeStation = async function (point, ignoreAviability) {
		    try {
		        // Filtrar estaciones según ignoreAviability
		        let filteredStations = valenbisiStations.filter(station => {
		            if (ignoreAviability === 1) return station.available > 0;
		            if (ignoreAviability === 2) return station.available < station.total;
		            return true;
		        });

		        if (filteredStations.length === 0) return null;

		        // Calcular la distancia Haversine y seleccionar los 3 más cercanos
		        let candidates = filteredStations
		            .map(station => ({
		                station,
		                distance: haversineDistance(point, { lat: station.lat, lon: station.lon })
		            }))
		            .sort((a, b) => a.distance - b.distance)
		            .slice(0, 3);

		        if (candidates.length === 0) return null;

		        // Construir la URL para la API Distance Matrix
		        const origins = point.lat + "," + point.lng;
		        const destinations = candidates.map(c => c.station.lat + "," + c.station.lon).join("|");

				const url = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + origins +
				            "&destinations=" + destinations +
				            "&mode=walking&units=metric&key=" + apiKey;
							
				console.log(url);
							
				const response = await fetch(url);
				const data = await response.json();


		        if (data.status !== "OK") {
		            console.error("Error en la API de Google Maps:", data);
		            return null;
		        }

		        // Obtener la mejor estación basada en la distancia caminando
		        const elements = data.rows[0].elements;
		        let bestIndex = -1;
		        let bestDistance = Infinity;

		        elements.forEach((element, index) => {
		            if (element.status === "OK" && element.distance.value < bestDistance) {
		                bestDistance = element.distance.value;
		                bestIndex = index;
		            }
		        });

		        if (bestIndex !== -1) {
		            const bestStation = candidates[bestIndex].station;
		            return {
		                lat: bestStation.lat,
		                lng: bestStation.lon,
		                address: bestStation.address,
		                available: bestStation.available,
		                total: bestStation.total,
		                walkingDistance: bestDistance // Distancia en metros
		            };
		        }
		    } catch (error) {
		        console.error("Error llamando a Google Maps API:", error);
		    }

		    return null;
		};
	
		
		
		
		const findNearestTaxiStation = async function (point) {
		    try {

		        let candidates = taxiStations
		            .map(station => ({
		                station,
		                distance: haversineDistance(point, { lat: station.lat, lon: station.lon })
		            }))
		            .sort((a, b) => a.distance - b.distance)
		            .slice(0, 3);

		        if (candidates.length === 0) return null;

		        // Construir la URL para la API Distance Matrix
		        const origins = point.lat + "," + point.lng;
		        const destinations = candidates.map(c => c.station.lat + "," + c.station.lon).join("|");

				const url = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" + origins +
				            "&destinations=" + destinations +
				            "&mode=walking&units=metric&key=" + apiKey;
							
				console.log(url);
							
				const response = await fetch(url);
				const data = await response.json();

				console.log(data);

		        if (data.status !== "OK") {
		            console.error("Error en la API de Google Maps:", data);
		            return null;
		        }

		        // Obtener la mejor estación basada en la distancia caminando
		        const elements = data.rows[0].elements;
		        let bestIndex = -1;
		        let bestDistance = Infinity;

		        elements.forEach((element, index) => {
		            if (element.status === "OK" && element.distance.value < bestDistance) {
						console.log("candidato");
		                bestDistance = element.distance.value;
		                bestIndex = index;
		            }
		        });

		        if (bestIndex !== -1) {
		            const bestStation = candidates[bestIndex].station;
					console.log("tiene la mejor: " + bestStation.lat + bestStation.lon + bestStation.calle + bestDistance );
		            return {
		                lat: bestStation.lat,
		                lng: bestStation.lon,
		                address: bestStation.calle,
		                walkingDistance: bestDistance // Distancia en metros
		            };
		        }
		    } catch (error) {
		        console.error("Error llamando a Google Maps API:", error);
		    }
			Consoloe.log("sale por null");
		    return null;
		};
		
		
		function haversineDistance(coord1, coord2) {
			
			let lng2;
				if (coord2.lng == null){
					lng2 = 	coord2.lon;
				}
				else{        		
					lng2 = 	coord2.lng;
				}
				
			  const R = 6371; // Radio de la Tierra en km
			  const dLat = (parseFloat(coord2.lat) - parseFloat(coord1.lat)) * Math.PI / 180;
			  const dLon = (parseFloat(lng2) - parseFloat(coord1.lng)) * Math.PI / 180;
			  const a = Math.pow(Math.sin(dLat / 2), 2) +
			            Math.cos(parseFloat(coord1.lat) * Math.PI / 180) * Math.cos(parseFloat(coord2.lat) * Math.PI / 180) *
			            Math.pow(Math.sin(dLon / 2), 2);
			  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			  return R * c;
		}
