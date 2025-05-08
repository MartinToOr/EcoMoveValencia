import express from 'express';
import cors from 'cors';
import path from 'path';
import fetch from "node-fetch";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;






























let valenbisiStations = [];
let taxiStations = []; 
let stationUsage;
let stationBusUsage;
let stationRodaliaUsage;
let apiKey = "AIzaSyCzX88lbn1Xa_pouaPX4k_4IjRuJsjB064";
const router = express.Router();
app.use(cors());
app.use(express.json()); // Asegura que el body se maneje como JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); 
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
