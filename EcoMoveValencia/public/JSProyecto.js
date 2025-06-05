


let inicio; 

        // Función principal que calcula distancias y rutas
        function calculateDistanceAndRoute() {
          if (!pointA || !pointB) return;

          const origin = new google.maps.LatLng(pointA.lat, pointA.lng);
          const destination = new google.maps.LatLng(pointB.lat, pointB.lng);

		  if (transportMode === "COMPARA") {
			inicio = performance.now();
		      let modes = ["WALKING", "DRIVING", "BICYCLING", "PATINETE", "Valenbisi", "METRO", "BUS", "TRAIN", "ELECTRIC_MOTORBIKE", "TAXI"];
		      let results = [];
		      let completedRequests = 0;

		      modes.forEach(mode => {
		          let url;
		          if (mode === "Valenbisi") {
		              url = "https://ecomovevalencia.onrender.com/api/buscaEstacionBici?Olat=" + pointA.lat + "&Olng=" + pointA.lng +
		                    "&Dlat=" + pointB.lat + "&Dlng=" + pointB.lng + "&ignoreAviabilityO=0&ignoreAviabilityD=0";
		          } else if (mode === "METRO") {
		              url = "https://ecomovevalencia.onrender.com/rutaTansPub?oLat=" + pointA.lat + "&oLng=" + pointA.lng +
		                    "&dLat=" + pointB.lat + "&dLng=" + pointB.lng + "&tm=subway|tram";
		          } else if (mode === "BUS") {
		              url = "https://ecomovevalencia.onrender.com/rutaTansPub?oLat=" + pointA.lat + "&oLng=" + pointA.lng +
		                    "&dLat=" + pointB.lat + "&dLng=" + pointB.lng + "&tm=bus";
		          }
				  else if (mode === "TRAIN") {
				  	url = "https://ecomovevalencia.onrender.com/rutaTansPub?oLat=" + pointA.lat + "&oLng=" + pointA.lng +
				  		     "&dLat=" + pointB.lat + "&dLng=" + pointB.lng + "&tm=train";
				  		          }	
			     else if (mode === "PATINETE") {
					url = "https://ecomovevalencia.onrender.com/rutaTransportTipical?oLat=" + pointA.lat + "&oLng=" + pointA.lng +
							   "&dLat=" + pointB.lat + "&dLng=" + pointB.lng + "&mode=bicycling";
								  	 }	
				else if (mode === "ELECTRIC_MOTORBIKE"){
					url = "https://ecomovevalencia.onrender.com/rutaMotoElectrica?oLat=" + pointA.lat + "&oLng=" + pointA.lng +
							"&dLat=" + pointB.lat + "&dLng=" + pointB.lng + "&mode=driving";
				}							
				else if (mode === "TAXI"){
					url ="https://ecomovevalencia.onrender.com/api/buscaEstacionTaxi?Olat=" + pointA.lat + "&Olng=" + pointA.lng +
							                    "&Dlat=" + pointB.lat + "&Dlng=" + pointB.lng;
				}		  
				   else {
		              // Para WALKING, DRIVING y BICYCLING se utiliza el endpoint de rutas típicas
		              url = "https://ecomovevalencia.onrender.com/rutaTransportTipical?oLat=" + pointA.lat + "&oLng=" + pointA.lng +
		                    "&dLat=" + pointB.lat + "&dLng=" + pointB.lng + "&mode=" + mode.toLocaleLowerCase();
		          }
					console.log(mode + ": " + url);
				  fetch(url, {
				    method: "GET",
				    headers: {
				      "ngrok-skip-browser-warning": "true"  // Encabezado para evitar la advertencia del navegador
				    }
				  })
		              .then(response => {
						if (!response.ok){

							//throw new Error(`Error en la solicitud: ${response.status}`);
						} 
		                  return response.json();
		              })
		              .then(data => {
		                  // Procesa la respuesta según el modo (caso especial para "BICI")
						  
						  if (mode === "DRIVING"){
							let vehicleTypes = [
							    { type: "Coche eléctrico", emissionMode: "ELECTRIC_CAR" },
							    { type: "Coche diésel", emissionMode: "DIESEL_CAR" },
							    { type: "Coche gasolina", emissionMode: "GASOLINE_CAR" },
								{ type: "Coche híbrido", emissionMode: "COCHE_HIBRIDO" },
								{ type: "Coche de hidrogeno", emissionMode: "COCHE_DE_HIDROGENO" },
								{ type: "CAMION", emissionMode: "CAMION" },
							    { type: "Moto de combustión", emissionMode: "COMBUSTION_MOTORBIKE" }
							];
							vehicleTypes.forEach(vehicle => {
								let routeData = processRouteData(data, vehicle.emissionMode);
								results.push({ mode: vehicle.emissionMode, ...routeData });
							 });
							
						  }
						  else if (mode === "ELECTRIC_MOTORBIKE"){						  
							let vehicleTypes = [
						  		{ type: "MotoElectrica", emissionMode: "ELECTRIC_MOTORBIKE" },
						  		{ type: "Ciclomotor", emissionMode: "CICLOMOTOR" }
						  	];
						  	vehicleTypes.forEach(vehicle => {
						  		let routeData = processRouteData(data, vehicle.emissionMode);
						  		results.push({ mode: vehicle.emissionMode, ...routeData });
						  	 });
						  }
						  else{
							let routeData = processRouteData(data, mode);
							results.push({ mode: mode, ...routeData });
						  }

		              })
		              .catch(error => {
		                  console.error("Error al obtener datos para " + mode + ": " + error);
		                  results.push({ mode: mode, error: error.message });
		              })
		              .finally(() => {
		                  completedRequests++;
		                  if (completedRequests === modes.length) {
		                      // Una vez finalizadas todas las peticiones, se muestra el grid en un modal
		                      renderComparisonSlickGrid(results);
		                  }
		              });
		      });

		  }

          else if (transportMode === "Valenbisi") {			// Verificar que hay estaciones disponibles			
			muestraRutaValenbisi();    
          }
          else if (transportMode === "METRO") {
			muestraRutaMetroValencia()
          }
		  else if (transportMode === "BUS") {
		  muestraRutaEMTValencia();
		  }
		  else if (transportMode === "PATINETE") {
		  muestraRutaPatinete();
		  }

		  else if (transportMode === "TRAIN") {
		  muestraRutaRodalia();
		  }
		  else if (transportMode === "TAXI") {
		  muestraRutaTaxi(); 
		  }
		  else if (transportMode === "ELECTRIC_MOTORBIKE" || transportMode === "CICLOMOTOR") {
			console.log(transportMode);
		  muestraRutaELECTRIC_MOTORBIKE(transportMode);
		  }
          else {            	  
			muestraRutaTipica(transportMode);		
          } 
        	  
          
        }
		

		/* Función para procesar la respuesta de la API y extraer:
		   - Distancia total (en metros)
		   - Tiempo total (en segundos)
		   - Desglose de cada tramo (subRoutes)
		   - Emisiones CO2 estimadas
		   Se trata de forma especial el modo "BICI" */
		   function processRouteData(data, mode) {
		       let result = {};
		       console.log("modo: " + mode);
		       // Mapeo de modos a palabras clave esperadas en la respuesta JSON
		       const expectedKeywords = {
		           "WALKING": "WALKING",
		           "DRIVING": "DRIVING",                   
		           "ELECTRIC_CAR": "DRIVING",
		           "DIESEL_CAR": "DRIVING",
		           "GASOLINE_CAR": "DRIVING",
		           "COMBUSTION_MOTORBIKE": "DRIVING",
		           "ELECTRIC_MOTORBIKE": "DRIVING",
		           "CICLOMOTOR": "DRIVING",
		           "Valenbisi": "BICYCLING",             
		           "BICYCLING": "BICYCLING",
		           "PATINETE": "BICYCLING",
		           "METRO": ["SUBWAY", "TRAM"],
		           "TRAIN": "HEAVY_RAIL",
		           "BUS": "BUS",
		           "COCHE_HIBRIDO": "DRIVING",
		           "COCHE_DE_HIDROGENO": "DRIVING",
		           "CAMION": "DRIVING",
				   "TAXI": "DRIVING"
		       };

			   // Usar el sistema de traducción tt() en lugar de un objeto estático
			   const errorMessages = {
			       "WALKING": t("error_ruta_andando"),
			       "DRIVING": t("error_ruta_coche"),
			       "Valenbisi": t("error_ruta_valenbisi"),
			       "TAXI": t("error_ruta_taxi"),
			       "BICYCLING": t("error_ruta_bici"),
			       "PATINETE": t("error_ruta_patinete"),
			       "METRO": t("error_ruta_metro"),
			       "TRAIN": t("error_ruta_rodalias"),
			       "BUS": t("error_ruta_autobus"),
			       "GENERAL": t("error_ruta_general")
			   };


		       let dataString = JSON.stringify(data);

		       // Verificamos si la respuesta contiene la palabra clave esperada
		       if (mode === "METRO") {
		           if (!dataString.includes("SUBWAY") && !dataString.includes("TRAM")) {
		               result.error = errorMessages["METRO"];
		               return result;
		           }
		       } else {
		           if (!dataString.includes(expectedKeywords[mode])) {
		               result.error = errorMessages[mode];
		               return result;
		           }
		       }

		       // Si hay un error en la solicitud (por ejemplo, código de error en la respuesta)
		       if (data.error || !data) {
		           result.error = errorMessages["GENERAL"];
		           return result;
		       }

		       // Si el modo es "Valenbisi", tratamos la ruta como "BICI" pero ajustando el tiempo
			   if (mode === "Valenbisi") {
				console.log("Entra en valenbisi")
			       let totalDistance = 0, totalTime = 0;
			       let combinedSteps = [];
			       let bikingDistance = 0;
			       let parts = ['walkingToStation', 'bikingRoute', 'walkingFromStation'];

			       parts.forEach(part => {
			           if (data[part] && data[part].routes && data[part].routes.length > 0 && data[part].routes[0].legs && data[part].routes[0].legs.length > 0) {
			               let leg = data[part].routes[0].legs[0];
			               totalDistance += leg.distance ? leg.distance.value : 0;
			               totalTime += leg.duration ? leg.duration.value : 0;

			               if (leg.steps && leg.steps.length > 0) {
			                   combinedSteps = combinedSteps.concat(leg.steps.map(step => ({
			                       mode: step.travel_mode,
			                       distance: step.distance ? step.distance.value : 0,
			                       duration: step.duration ? step.duration.value : 0
			                   })));

			                   leg.steps.forEach(step => {
			                       if (step.travel_mode === "BICYCLING") {
			                           bikingDistance += step.distance ? step.distance.value : 0;
			                       }
			                   });
			               }
			           }
			       });

			       // Si la distancia en bicicleta o patinete es menor a 10 metros, mostramos el error de ValenBisi
			       if (bikingDistance < 10 && mode === "Valenbisi") {
			           result.error = errorMessages["Valenbisi"];
			           return result;
			       }

			       // Actualizamos la información de la ruta
			       result.totalDistance = totalDistance;
			       result.totalTime = totalTime;
			       result.subRoutes = combinedSteps;
			       result.co2 = calculateCO2(mode, totalDistance);
			       result.mode = mode === "PATINETE" ? "En patinete" : "Valenbisi";
			       result.ruta = "MostrarRuta";
			       result.data = data;
			   } 
			   
			   
			   
			   else if (mode === "TAXI") {
				console.log("Entra en taxi")
			       let totalDistance = 0, totalTime = 0;
			       let combinedSteps = [];
			       let taxiDistance = 0;
			       let parts = ['walkingToStation', 'taxi'];

			       parts.forEach(part => {
			           if (data[part] && data[part].routes && data[part].routes.length > 0 && data[part].routes[0].legs && data[part].routes[0].legs.length > 0) {
			               let leg = data[part].routes[0].legs[0];
			               totalDistance += leg.distance ? leg.distance.value : 0;
			               totalTime += leg.duration ? leg.duration.value : 0;

			               if (leg.steps && leg.steps.length > 0) {
			                   combinedSteps = combinedSteps.concat(leg.steps.map(step => ({
			                       mode: step.travel_mode,
			                       distance: step.distance ? step.distance.value : 0,
			                       duration: step.duration ? step.duration.value : 0
			                   })));

			                   leg.steps.forEach(step => {
			                       if (step.travel_mode === "DRIVING") {
			                           taxiDistance += step.distance ? step.distance.value : 0;
			                       }
			                   });
			               }
			           }
			       });

	

			       // Actualizamos la información de la ruta
			       result.totalDistance = totalDistance;
			       result.totalTime = totalTime;
			       result.subRoutes = combinedSteps;
			       result.co2 = calculateCO2(mode, taxiDistance);
			       result.mode = mode === "taxi" ? "En taxi" : "Taxi";
			       result.ruta = "MostrarRuta";
			       result.data = data;
			   } 
			   
			   
			   
			   
			   
			   
			   
			   else {
		           console.log("Entra como otros");
		           // En otros modos de transporte (no "BICI" o "PATINETE")
		           if (data && data.routes && data.routes.length > 0 && data.routes[0].legs && data.routes[0].legs.length > 0) {

		               let leg = data.routes[0].legs[0];
		               result.totalDistance = leg.distance ? leg.distance.value : 0;
		               result.totalTime = leg.duration ? leg.duration.value : 0;
		               result.subRoutes = leg.steps ? leg.steps.map(step => ({
		                   mode: step.travel_mode,
		                   distance: step.distance ? step.distance.value : 0,
		                   duration: step.duration ? step.duration.value : 0
		               })) : [];

		               // Para BUS y METRO, sumar únicamente la distancia de pasos de tipo TRANSIT,
		               // ya que la API devuelve estos tramos como "TRANSIT".
		               if (mode === "BUS" || mode === "METRO") {
		                   let transitDistance = 0;
		                   if (leg.steps && leg.steps.length > 0) {
		                       leg.steps.forEach(step => {
		                           if (step.travel_mode === "TRANSIT") {
		                               transitDistance += step.distance ? step.distance.value : 0;
		                           }
		                       });
		                   }
		                   result.co2 = calculateCO2(mode, transitDistance);
		               } else {
		                   result.co2 = calculateCO2(mode, result.totalDistance);
		               }
		               result.ruta = "MostrarRuta";
		               result.data = data;
		           } else {
		               result.error = errorMessages["GENERAL"];
		           }
		           
		           if (mode === "PATINETE") {
		               result.totalTime = result.totalTime * 0.78; // Reduce el tiempo en un 22%
		           }
		       }

		       // Si hay un error en la solicitud o falta de datos, lo agregamos al resultado
		       if (data.error || !data) {
		           result.error = errorMessages["GENERAL"];
		       }

		       return result;
		   }







		/* Función para calcular las emisiones CO2 (en gramos) en función del modo y la distancia (en metros) */
		function calculateCO2(mode, distanceMeters) {
		    let km = distanceMeters / 1000;
		    let factor;
		    switch (mode) {
		        case "DRIVING":
		            factor = 100; // gCO2/km (valor de ejemplo)
		            break;
		        case "BUS":
		            factor = 49.9;
		            break;
				case "METRO":
					factor = 30;
					break;
				case "PATINETE":
					factor = 3;
					break;
				case "TRAIN":
					factor = 33;
					break;					
				case "ELECTRIC_CAR":
					factor = 43;
					break;										
				case "DIESEL_CAR": 
					factor = 79.28;
					break;					
				case "GASOLINE_CAR": 
					factor = 102.14;
					break;
				case "COMBUSTION_MOTORBIKE": 
					factor = 53;
					break;					
				case "ELECTRIC_MOTORBIKE": 
					factor = 14;
					break;
				case "CICLOMOTOR": 
					factor = 65;
					break;
				case "COCHE_HIBRIDO": 
					factor = 65;
					break;
				case "COCHE_DE_HIDROGENO": 
					factor = 71.42;
					break;
				case "CAMION": 
					factor = 786;
					break;	
				case "TAXI": 
					factor = 78.61;
					break;
					
					
		        // Suponemos que caminar o ir en bici no emiten (o son insignificantes)
		        case "WALKING":
		        case "BICYCLING":
		        case "Valenbisi":
		            factor = 0;
		            break;
		        default:
		            factor = 0;
		    }
		    return km * factor;
		}

		/* Función para formatear la distancia: convierte metros a km con dos decimales */
		function formatDistance(distanceMeters) {
		    let km = distanceMeters / 1000;
		    return km.toFixed(2) + " km";
		}

		/* Función para formatear el tiempo.
		   - Si es menor a 3600 segundos, lo muestra en minutos y segundos.
		   - Si supera 3600 segundos, lo muestra en horas, minutos y segundos. */
		function formatTime(totalSeconds) {
		    totalSeconds = Math.round(totalSeconds);
		    if (totalSeconds < 3600) {
		        let minutes = Math.floor(totalSeconds / 60);
		        let seconds = totalSeconds % 60;
		        return minutes + " min " + seconds + " s";
		    } else {
		        let hours = Math.floor(totalSeconds / 3600);
		        let remainder = totalSeconds % 3600;
		        let minutes = Math.floor(remainder / 60);
		        let seconds = remainder % 60;
		        return hours + " h " + minutes + " min " + seconds + " s";
		    }
		}

		/* Función para agrupar los subtramos consecutivos con el mismo modo.
		   Si un paso tiene travel_mode "TRANSIT", se interpreta según el modo principal:
		     - Si el modo principal es "METRO", se agrupa como "METRO"
		     - Si es "BUS", se agrupa como "BUS"
		   Por ejemplo, en lugar de:
		     WALKING (49 m) | WALKING (57 m) | WALKING (27 m)
		   Se mostrará:
		     Andando durante 0.13 km
		*/
		function groupSubRoutes(steps, parentMode) {
		    if (!steps || steps.length === 0) return "";
		    let groupedMap = new Map();
		    
			steps.forEach(step => {
			    let effectiveMode = step.mode === "TRANSIT" 
			        ? (parentMode === "METRO" ? "METRO" : (parentMode === "BUS" ? "BUS" : "TRANSIT"))
			        : step.mode;

			    // Si el parentMode es "BICI", cambiar a "ValenBisi"
			    if (parentMode === "Valenbisi") {
			        step.mode = "ValenBisi";
			    }
			    
			    if (groupedMap.has(effectiveMode)) {
			        groupedMap.get(effectiveMode).distance += step.distance;
			    } else {
			        groupedMap.set(effectiveMode, { mode: effectiveMode, distance: step.distance });
			    }
			});

		    
		    let grouped = Array.from(groupedMap.values());
		    
		    let detailStr = grouped.map(g => {
		        let translatedMode = modeTranslations[idiomaActual][g.mode] || g.mode;
				console.log("padre " + parentMode + " Translated " + translatedMode );
				if(parentMode === "Taxi" && translatedMode === "Conduciendo" ){return `En taxi durante ${formatDistance(g.distance)}`;}
				if(parentMode === "Taxi" && translatedMode === "Driving" ){return `By taxi for ${formatDistance(g.distance)}`;}
				if(parentMode === "Taxi" && translatedMode === "Conduint" ){return `En taxi durant ${formatDistance(g.distance)}`;}

				if(parentMode === "PATINETE"){return `En patinete durante ${formatDistance(g.distance)}`;}
				
				if(parentMode === "TRAIN" && translatedMode === "TRANSIT" ){return `En Rodalia durante ${formatDistance(g.distance)}`;}
				else{return `${translatedMode} durante ${formatDistance(g.distance)}`;}
				
		        
		    }).join(" | ");
		    
		    return detailStr;
		}

	/*	
		function normalizaModo(inputMode) {
		  // Convertimos el input a minúsculas para comparar de forma insensible a mayúsculas/minúsculas
		  const inputLower = inputMode.toLowerCase();
		  for (let key in modeTranslations) {
		    if (modeTranslations[key].toLowerCase() === inputLower) {
		      return key;
		    }
		  }
		  // Si no se encuentra coincidencia, se devuelve el input original
		  return inputMode;
		}
*/

		
		
		function renderComparisonSlickGrid(results) {
		    let modal = document.createElement("div");
		    modal.id = "comparisonModal";
		    modal.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;";

		    let modalContent = document.createElement("div");
			
			if (window.innerWidth <= 768) {
				modalContent.style.width = "700px";
				modalContent.style.height = "470px";
				modalContent.style.padding = "20px";
				modalContent.style.borderRadius = "8px";
				modalContent.style.fontSize = "16px";


			} else {
			  modalContent.style.width = "1300px";
			  modalContent.style.height = "530px";
			  modalContent.style.padding = "20px";
			  modalContent.style.borderRadius = "8px";
			  modalContent.style.fontSize = "16px";
			}

		    modalContent.style = "background-color: #fff; padding: 20px; border-radius: 8px; width: 1300px; height: 530px; position: relative;";

		    let closeButton = document.createElement("button");
		    closeButton.textContent = "✖";
		    closeButton.style = "position: absolute; top: 10px; right: 10px; border: none; background: transparent; font-size: 20px; cursor: pointer; color: #000;";
		    closeButton.onmouseover = () => closeButton.style.color = "red";
		    closeButton.onmouseout = () => closeButton.style.color = "#000";
		    closeButton.onclick = () => document.body.removeChild(modal);
		    modalContent.appendChild(closeButton);

		    let gridContainer = document.createElement("div");
		    gridContainer.id = "gridContainer";
		    gridContainer.style = "width: 100%; height: 100%; top: 20px;";
		    modalContent.appendChild(gridContainer);

		    modal.appendChild(modalContent);
			
			const style = document.createElement("style");
			style.textContent = `
			    .slick-header-column {
			        height: 40px !important;
			        line-height: 40px !important;
			        font-size: 15px;
			    }
			    .slick-header-columns {
			        height: 40px !important;
			    }
			`;
			document.head.appendChild(style);
		    document.body.appendChild(modal);

			let allColumns = [
			  { id: "mode", name: tt("modo"), field: "mode", width: 160, sortable: false },
			  { id: "distance", name: tt("distancia"), field: "distance", width: 120, sortable: true },
			  { id: "time", name: tt("tiempo"), field: "time", width: 115, sortable: true },
			  { id: "co2", name: tt("co2"), field: "co2", width: 250, sortable: true },
			  { id: "detail", name: tt("detalle"), field: "detail", width: 415 },
			  {
			    id: "ruta",
			    name: tt("ver_ruta"),
			    field: "route",
			    width: 110,
			    formatter: (row, cell, value, columnDef, dataContext) => {
			      return value !== "-" ? `<span style='cursor:pointer;color:blue;text-decoration:underline;'>${tt("ver_ruta")}</span>` : "-";
			    }
			  }
			];

			let mobileColumns = allColumns.slice(0, 4); // Solo las 4 primeras para móvil

			let columns = window.innerWidth <= 768 ? mobileColumns : allColumns;



		    var options = {
		        enableCellNavigation: true,
		        enableColumnReorder: true,
		        enableSorting: true,
		        forceFitColumns: true
		    };

		    var data = results.map(item => {
		        return item.error ? {
		            mode: modeTranslations[idiomaActual][item.mode] || item.mode,
		            distance: "-",
		            time: "-",
		            co2: "-",
		            detail: item.error,
		            route: "-"
		        } : {
		            mode: modeTranslations[idiomaActual][item.mode] || item.mode,
		            distance: item.totalDistance ? `${(item.totalDistance / 1000).toFixed(2)} km` : "-",
		            time: item.totalTime ? `${Math.floor(item.totalTime / 60)} min ${(item.totalTime % 60).toFixed(0)} s` : "-",
		            co2: item.co2 ? item.co2.toFixed(2) : "0",
		            detail: groupSubRoutes(item.subRoutes, item.mode),
		            route: item
		        };
		    });
			

		    data.sort((a, b) => parseFloat(a.co2 || 0) - parseFloat(b.co2 || 0));

		    var grid = new Slick.Grid("#gridContainer", data, columns, options);

		    grid.onSort.subscribe((e, args) => {
		        let field = args.sortCol.field;
		        let isAscending = args.sortAsc;

		        data.sort((a, b) => {
		            let valA = a[field], valB = b[field];
		            let isAInvalid = valA === "-";
		            let isBInvalid = valB === "-";

		            if (isAInvalid && isBInvalid) return 0;
		            if (isAInvalid) return 1;
		            if (isBInvalid) return -1;

		            if (field === "time") {
		                valA = timeToSeconds(valA);
		                valB = timeToSeconds(valB);
		            } else if (field === "co2" || field === "distance") {
		                valA = parseFloat(valA) || 0;
		                valB = parseFloat(valB) || 0;
		            }

		            return isAscending ? valA - valB : valB - valA;
		        });

		        grid.setData(data);
		        grid.render();
		    });

			// Obtener referencia al botón
			const btnMostrarModal = document.getElementById("btnMostrarModal");

			grid.onClick.subscribe((e, args) => {
			    let item = data[args.row];
			    if (args.cell === grid.getColumnIndex("ruta") && item.route !== "-") {
			        // Eliminar el modal
			        document.body.removeChild(modal);

			        // Mostrar el botón para volver a abrir el modal
			        btnMostrarModal.style.display = "block";

					const modoNormalizado = item.route.mode;

					console.log(modoNormalizado);
					
					   if (modoNormalizado === "Valenbisi") {
					     muestraRutaValenbisi();
					   } else if (modoNormalizado === "METRO") {
					 	muestraRutaMetroValencia();
					 	} else if (modoNormalizado === "Taxi") {
						 muestraRutaTaxi();
						} else if (modoNormalizado === "BUS") {
					     muestraRutaEMTValencia();
					   } else if (modoNormalizado === "PATINETE") {
					     muestraRutaPatinete();
					   } else if (modoNormalizado === "TRAIN") {
					     muestraRutaRodalia();
					   }else if (["ELECTRIC_CAR", "DIESEL_CAR", "GASOLINE_CAR", "COMBUSTION_MOTORBIKE", "COCHE_HIBRIDO", "COCHE_DE_HIDROGENO", "CAMION"].includes(modoNormalizado)) {
						transportMode = "DRIVING"; 
						muestraRutaTipica(modoNormalizado);
					   } else if (["ELECTRIC_MOTORBIKE", "CICLOMOTOR"].includes(modoNormalizado)) {
						muestraRutaELECTRIC_MOTORBIKE(modoNormalizado);
						} else if (modoNormalizado === "WALKING") {
					     transportMode = "WALKING";
					     muestraRutaTipica(modoNormalizado);
					   } else if (modoNormalizado === "BICYCLING") {
					     transportMode = "BICYCLING";
					     muestraRutaTipica(modoNormalizado);
					   }
			    }
				
			});

			// Evento para mostrar el modal cuando se presione el botón
			btnMostrarModal.addEventListener("click", () => {
			    // Eliminar cualquier modal existente antes de agregar uno nuevo
			    const existingModal = document.getElementById("comparisonModal");
			    if (existingModal) {
			        document.body.removeChild(existingModal);
			    }

			    // Agregar el nuevo modal
			    document.body.appendChild(modal);

			    let modalDerecha = document.getElementById("googleMapsModal");
			    modalDerecha.style.display = "none";
			    btnMostrarModal.style.display = "none"; 

			    setTimeout(() => {
			        grid.resizeCanvas();
			        grid.render();
			    }, 10);
			});

			const fin = performance.now();
			console.log(`Tiempo de ejecución: ${(fin - inicio).toFixed(0)} milisegundos`);

}

function timeToSeconds(timeStr) {
    if (!timeStr) return 0;
    let parts = String(timeStr).trim().split(" ");
    let minutes = 0, seconds = 0;
    if (parts.length === 2) {
        minutes = parseInt(parts[0], 10);
        seconds = parseInt(parts[1], 10);
    } else {
        seconds = parseInt(parts[0], 10);
    }
    return (minutes * 60) + seconds;
}

        
        function decodePolyline(encoded) {
        	  const len = encoded.length;
        	  const points = [];
        	  let index = 0;
        	  let lat = 0;
        	  let lng = 0;

        	  while (index < len) {
        	    let b, shift = 0, result = 0;
        	    do {
        	      b = encoded.charCodeAt(index++) - 63;
        	      result |= (b & 0x1f) << shift;
        	      shift += 5;
        	    } while (b >= 0x20);
        	    lat += (result & 1) ? ~(result >> 1) : (result >> 1);

        	    shift = 0;
        	    result = 0;
        	    do {
        	      b = encoded.charCodeAt(index++) - 63;
        	      result |= (b & 0x1f) << shift;
        	      shift += 5;
        	    } while (b >= 0x20);
        	    lng += (result & 1) ? ~(result >> 1) : (result >> 1);

        	    points.push({ lat: lat / 1E5, lng: lng / 1E5 });
        	  }
        	  return points;
        	}

        
        
        // €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
        
        


// Función sencilla para calcular la distancia (puedes reemplazarla por la fórmula de Haversine si lo prefieres)


/*
  Calcula la ruta de metro entre dos estaciones.
  - Si ambas estaciones comparten línea, se extrae el tramo correspondiente.
  - Si no comparten línea, se busca una estación de transbordo (que pertenezca a una línea común a ambas)
    y se arma la ruta en dos tramos.
*/
let lastMetroDistance = 0;
let distancia_total = 0;
let segundos_total = 0;

    
        
        // €€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€€
        
        
       

		function moveToMidPointMarkers(marker1, marker2) {
		  let bounds = L.latLngBounds([marker1, marker2]);

		  // Ajustar padding según pantalla
		  let isMobile = window.innerWidth <= 768;

		  map.flyToBounds(bounds, {
		    paddingTopLeft: isMobile ? [50, 50] : [150, 150],
		    paddingBottomRight: isMobile ? [50, 50] : [400, 150],
		    duration: 1.5
		  });
		}


		
function muestraRutaMetroValencia(){


			

			  			    const peticionBUS = "https://ecomovevalencia.onrender.com/rutaTansPub?oLat=" + pointA.lat + "&oLng=" + pointA.lng + "&dLat=" + pointB.lat + "&dLng=" + pointB.lng + "&tm=subway|tram";

			  			    // Función para obtener la ruta en bus

							
							const PeticionMetro = async () => {
							    try {
							        const response = await fetch(peticionBUS, {
							            method: 'GET', // Puedes ajustar el método si es necesario
							            headers: {
							                "ngrok-skip-browser-warning": "true"  // Encabezado para evitar la advertencia del navegador
							            }
							        });

									if (!response.ok){
										
										mostrarPopupInfo(tm("ruta_metro_error"), "error");
										throw new Error(`Error en la solicitud: ${response.status}`);
									} 
							        const respuesta = await response.json();
							        console.log("Respuesta API:", respuesta);

							        if (!respuesta.routes || respuesta.routes.length === 0) {
							            throw new Error("No se encontraron rutas disponibles.");
							        }

							        return respuesta;
							    } catch (error) {
							        console.error("Error en fetch:", error);
							        return null; // Retorna null en caso de error
							    }
							};


			  			    PeticionMetro()
			  			        .then(respuesta => {
			  			            if (!respuesta) {
			  			                console.error("No se pudo obtener la ruta en metro.");
			  			                return;
			  			            }
									
									let dataString = JSON.stringify(respuesta);
									let esEnMetro = true;
									if (!dataString.includes("SUBWAY") && !dataString.includes("TRAM")){
										esEnMetro = false;
										mostrarPopupInfo(tm("ruta_metro_alternativa"), "info");
									}

			  			            // Eliminar rutas previas del mapa
			  			            if (routePolyline) {
			  			                routePolyline.forEach(item => map.removeLayer(item));
			  			            }

			  			            // Validar estructura antes de acceder a los datos
			  			            if (!respuesta.routes[0] || !respuesta.routes[0].legs[0] || !respuesta.routes[0].legs[0].steps) {
			  			                console.error("Estructura de respuesta inválida.");
			  			                return;
			  			            }

			  			            const steps = respuesta.routes[0].legs[0].steps;

			  			            steps.forEach(step => {
			  			                let color = "green"; // Color por defecto (caminar)

			  			                // Si el paso es de tipo 'TRANSIT' (transporte público)
			  			                if (step.travel_mode === "TRANSIT") {
			  			                    color = "blue";
			  			                }

			  			                // Decodificar el polyline de Google Maps (para obtener los puntos de la ruta)
			  			                const stepCoords = decodePolyline(step.polyline.points).map(point => [point.lat, point.lng]);

			  			                // Dibujar la polilínea del paso con el color correspondiente
			  			                routePolyline.push(L.polyline(stepCoords, { color: color, weight: 4 }).addTo(map));
			  			            });
									showGoogleMapsModal(respuesta, "metro");
			  			            moveToMidPointMarkers(pointA, pointB);
									if(esEnMetro){
										document.getElementById("transport-select").value = "metro";
										toggleTransport("metro");	
										sincronizarSelectorPersonalizado("metro");			
									}

			  			        })
			  			        .catch(error => {
			  			            console.error("Error en la carga de estaciones:", error);
			  			        });
	
}
		
function muestraRutaEMTValencia(){


			    const peticionBUS = "https://ecomovevalencia.onrender.com/rutaTansPub?oLat=" + pointA.lat + "&oLng=" + pointA.lng + "&dLat=" + pointB.lat + "&dLng=" + pointB.lng + "&tm=bus";

			    // Función para obtener la ruta en bus
			    const PeticionBus = async () => {
			        try {
			            const response = await fetch(peticionBUS, {
						 method: 'GET', // Puedes ajustar el método si es necesario
						headers: {
						"ngrok-skip-browser-warning": "true"  // Encabezado para evitar la advertencia del navegador
						}
					});
			            if (!response.ok){
							
							mostrarPopupInfo(tm("ruta_bus_error"), "error");
							throw new Error(`Error en la solicitud: ${response.status}`);
						} 

			            const respuesta = await response.json();
			            console.log("Respuesta API:", respuesta);

			            if (!respuesta.routes || respuesta.routes.length === 0) {
			                throw new Error("No se encontraron rutas disponibles.");
			            }

			            return respuesta;
			        } catch (error) {
			            console.error("Error en fetch:", error);
			            return null; // Retorna null en caso de error
			        }
			    };

			    PeticionBus()
			        .then(respuesta => {
			            if (!respuesta) {
			                console.error("No se pudo obtener la ruta en bus.");
			                return;
			            }
						
						let dataString = JSON.stringify(respuesta);
						let EsEnBus = true;
						if (!dataString.includes("BUS")){
							EsEnBus = false;
							mostrarPopupInfo(tm("ruta_bus_alternativa"), "info");
						}
			            // Eliminar rutas previas del mapa
			            if (routePolyline) {
			                routePolyline.forEach(item => map.removeLayer(item));
			            }

			            // Validar estructura antes de acceder a los datos
			            if (!respuesta.routes[0] || !respuesta.routes[0].legs[0] || !respuesta.routes[0].legs[0].steps) {
			                console.error("Estructura de respuesta inválida.");
			                return;
			            }

			            const steps = respuesta.routes[0].legs[0].steps;

						let currentRouteCoords = [];
												steps.forEach(step => {
												    const stepCoords = decodePolyline(step.polyline.points).map(point => L.latLng(point.lat, point.lng));
													if(step.travel_mode === "TRANSIT"){
												   	 currentRouteCoords = currentRouteCoords.concat(stepCoords);
													}
												    // Dibujar la polilínea del paso...
												    routePolyline.push(L.polyline(stepCoords, { color: step.travel_mode === "TRANSIT" ? "blue" : "green", weight: 4 }).addTo(map));
												});
						if(EsEnBus){
							document.getElementById("transport-select").value = "bus";
							toggleTransport("bus", currentRouteCoords);
							sincronizarSelectorPersonalizado("bus");
						}


						

						showGoogleMapsModal(respuesta, "autobus");
			            moveToMidPointMarkers(pointA, pointB);
			        })
			        .catch(error => {
						
						console.error("Error en la carga de estaciones:", error);
						
			        });
	
}		


function muestraRutaRodalia(){


			    const peticionRod = "https://ecomovevalencia.onrender.com/rutaTansPub?oLat=" + pointA.lat + "&oLng=" + pointA.lng + "&dLat=" + pointB.lat + "&dLng=" + pointB.lng + "&tm=train";

			    // Función para obtener la ruta en bus
			    const PeticionRod = async () => {
			        try {
			            const response = await fetch(peticionRod, {
						 method: 'GET', // Puedes ajustar el método si es necesario
						headers: {
						"ngrok-skip-browser-warning": "true"  // Encabezado para evitar la advertencia del navegador
						}
					});
			            if (!response.ok){
							
							mostrarPopupInfo(tm("ruta_rodalia_error"), "error");
							throw new Error(`Error en la solicitud: ${response.status}`);
							
						} 

			            const respuesta = await response.json();
			            console.log("Respuesta API:", respuesta);

			            if (!respuesta.routes || respuesta.routes.length === 0) {
			                throw new Error("No se encontraron rutas disponibles.");
			            }

			            return respuesta;
			        } catch (error) {
			            console.error("Error en fetch:", error);
			            return null; // Retorna null en caso de error
			        }
			    };

			    PeticionRod()
			        .then(respuesta => {
			            if (!respuesta) {
			                console.error("No se pudo obtener la ruta en bus.");
			                return;
			            }
						
						
                                                let dataString = JSON.stringify(respuesta);

                                                const hasRodalia = dataString.includes("HEAVY_RAIL");
                                                if (!hasRodalia){
                                                        mostrarPopupInfo(tm("ruta_rodalia_alternativa"), "info");
                                                }

			            // Eliminar rutas previas del mapa
			            if (routePolyline) {
			                routePolyline.forEach(item => map.removeLayer(item));
			            }

			            // Validar estructura antes de acceder a los datos
			            if (!respuesta.routes[0] || !respuesta.routes[0].legs[0] || !respuesta.routes[0].legs[0].steps) {
			                console.error("Estructura de respuesta inválida.");
			                return;
			            }

			            const steps = respuesta.routes[0].legs[0].steps;

						let currentRouteCoords = [];
												steps.forEach(step => {
												    const stepCoords = decodePolyline(step.polyline.points).map(point => L.latLng(point.lat, point.lng));
													if(step.travel_mode === "TRANSIT"){
												   	 currentRouteCoords = currentRouteCoords.concat(stepCoords);
													}
												    // Dibujar la polilínea del paso...
												    routePolyline.push(L.polyline(stepCoords, { color: step.travel_mode === "TRANSIT" ? "orange" : "green", weight: 4 }).addTo(map));
												});
						
                                                                               if(hasRodalia){
                                                                                       document.getElementById("transport-select").value = "rodalia";
                                                                                       toggleTransport("rodalia", currentRouteCoords);
                                                                                       sincronizarSelectorPersonalizado("rodalia");
                                                                               } else {
                                                                                       document.getElementById("transport-select").value = "none";
                                                                                       toggleTransport("none");
                                                                                       sincronizarSelectorPersonalizado("none");
                                                                               }

						

						showGoogleMapsModal(respuesta, "rodalia");
			            moveToMidPointMarkers(pointA, pointB);
			        })
			        .catch(error => {
			            console.error("Error en la carga de estaciones:", error);
			        });
	
}		

	

function muestraRutaPatinete(){
	
	document.getElementById("transport-select").value = "none";
	            	  toggleTransport("none");
					  sincronizarSelectorPersonalizado("none");
	                  // Resto de modos de transporte (por ejemplo, TRANSIT, DRIVING, etc.)

		  
					  const peticionPat = "https://ecomovevalencia.onrender.com/rutaTransportTipical?oLat=" + pointA.lat + "&oLng=" + pointA.lng + "&dLat=" + pointB.lat + "&dLng=" + pointB.lng + "&mode=bicycling";
					  console.log(peticionPat);
					  
					  		    const PeticionPatinete = async () => {
					  		        try {
					  		            const response = await fetch(peticionPat										, {
																 method: 'GET', // Puedes ajustar el método si es necesario
																headers: {
																"ngrok-skip-browser-warning": "true"  // Encabezado para evitar la advertencia del navegador
																}
															});
					  		            if (!response.ok) throw new Error(`Error en la solicitud: ${response.status}`);

					  		            const respuesta = await response.json();
					  		      

					  		            if (!respuesta.routes || respuesta.routes.length === 0) {
					  		                throw new Error("No se encontraron rutas disponibles.");
					  		            }

					  		            return respuesta;
					  		        } catch (error) {
					  		            console.error("Error en fetch:", error);
					  		            return null; // Retorna null en caso de error
					  		        }
					  		    };

					  		    PeticionPatinete()
					  		        .then(respuesta => {
					  		            if (!respuesta) {
					  		                console.error("No se pudo obtener la ruta en bus.");
					  		                return;
					  		            }

					  		            // Eliminar rutas previas del mapa
					  		            if (routePolyline) {
					  		                routePolyline.forEach(item => map.removeLayer(item));
					  		            }

					  		            // Validar estructura antes de acceder a los datos
					  		            if (!respuesta.routes[0] || !respuesta.routes[0].legs[0] || !respuesta.routes[0].legs[0].steps) {
					  		                console.error("Estructura de respuesta inválida.");
					  		                return;
					  		            }

					  		            const steps = respuesta.routes[0].legs[0].steps;

					  		            steps.forEach(step => {
					  		                let color = "green"; // Color por defecto (caminar)

					  		              
											if (step.travel_mode === "DRIVING") {
											    color = "blue";
											}
											
											if (step.travel_mode === "BICYCLING") {
											    color = "red";
											}

					  		                // Decodificar el polyline de Google Maps (para obtener los puntos de la ruta)
					  		                const stepCoords = decodePolyline(step.polyline.points).map(point => [point.lat, point.lng]);

					  		                // Dibujar la polilínea del paso con el color correspondiente
					  		                routePolyline.push(L.polyline(stepCoords, { color: color, weight: 4 }).addTo(map));
					  		            });
										showGoogleMapsModal(respuesta, "PATINETE");
					  		            moveToMidPointMarkers(pointA, pointB);
					  		        })
					  		        .catch(error => {
					  		            console.error("Error en la carga de estaciones:", error);
					  		        });			  
					  
	
}	


function muestraRutaTipica(modoImp){
	
	document.getElementById("transport-select").value = "none";
	            	  toggleTransport("none");
					  sincronizarSelectorPersonalizado("none");
	                  // Resto de modos de transporte (por ejemplo, TRANSIT, DRIVING, etc.)
					  let modotrans = transportMode.toLowerCase();
		  
					  const peticionTip = "https://ecomovevalencia.onrender.com/rutaTransportTipical?oLat=" + pointA.lat + "&oLng=" + pointA.lng + "&dLat=" + pointB.lat + "&dLng=" + pointB.lng + "&mode="+modotrans ;

					  		    const PeticionTipica = async () => {
					  		        try {
					  		            const response = await fetch(peticionTip										, {
																 method: 'GET', // Puedes ajustar el método si es necesario
																headers: {
																"ngrok-skip-browser-warning": "true"  // Encabezado para evitar la advertencia del navegador
																}
															});
					  		            if (!response.ok) throw new Error(`Error en la solicitud: ${response.status}`);

					  		            const respuesta = await response.json();
					  		            console.log("Respuesta API:", respuesta);

					  		            if (!respuesta.routes || respuesta.routes.length === 0) {
					  		                throw new Error("No se encontraron rutas disponibles.");
					  		            }

					  		            return respuesta;
					  		        } catch (error) {
					  		            console.error("Error en fetch:", error);
					  		            return null; // Retorna null en caso de error
					  		        }
					  		    };

					  		    PeticionTipica()
					  		        .then(respuesta => {
					  		            if (!respuesta) {
					  		                console.error("No se pudo obtener la ruta en bus.");
					  		                return;
					  		            }

					  		            // Eliminar rutas previas del mapa
					  		            if (routePolyline) {
					  		                routePolyline.forEach(item => map.removeLayer(item));
					  		            }

					  		            // Validar estructura antes de acceder a los datos
					  		            if (!respuesta.routes[0] || !respuesta.routes[0].legs[0] || !respuesta.routes[0].legs[0].steps) {
					  		                console.error("Estructura de respuesta inválida.");
					  		                return;
					  		            }

					  		            const steps = respuesta.routes[0].legs[0].steps;

					  		            steps.forEach(step => {
					  		                let color = "green"; // Color por defecto (caminar)

					  		              
											if (step.travel_mode === "DRIVING") {
											    color = "blue";
											}
											
											if (step.travel_mode === "BICYCLING") {
											    color = "red";
											}

					  		                // Decodificar el polyline de Google Maps (para obtener los puntos de la ruta)
					  		                const stepCoords = decodePolyline(step.polyline.points).map(point => [point.lat, point.lng]);

					  		                // Dibujar la polilínea del paso con el color correspondiente
					  		                routePolyline.push(L.polyline(stepCoords, { color: color, weight: 4 }).addTo(map));
					  		            });
										showGoogleMapsModal(respuesta, modoImp);
					  		            moveToMidPointMarkers(pointA, pointB);
					  		        })
					  		        .catch(error => {
					  		            console.error("Error en la carga de estaciones:", error);
					  		        });			  
					  
	
}	

function muestraRutaELECTRIC_MOTORBIKE(transporteImp){
	
	document.getElementById("transport-select").value = "none";
	            	  toggleTransport("none");
					  sincronizarSelectorPersonalizado("none");
	                  // Resto de modos de transporte (por ejemplo, TRANSIT, DRIVING, etc.)
					  let modotrans = transportMode.toLowerCase();
		  
					  const peticionMOTORBIKE = "https://ecomovevalencia.onrender.com/rutaMotoElectrica?oLat=" + pointA.lat + "&oLng=" + pointA.lng + "&dLat=" + pointB.lat + "&dLng=" + pointB.lng + "&mode=driving" ;

					  		    const funcpeticionMOTORBIKE = async () => {
					  		        try {
					  		            const response = await fetch(peticionMOTORBIKE										, {
																 method: 'GET', // Puedes ajustar el método si es necesario
																headers: {
																"ngrok-skip-browser-warning": "true"  // Encabezado para evitar la advertencia del navegador
																}
															});
					  		            if (!response.ok) throw new Error(`Error en la solicitud: ${response.status}`);

					  		            const respuesta = await response.json();
					  		            console.log("Respuesta API:", respuesta);

					  		            if (!respuesta.routes || respuesta.routes.length === 0) {
					  		                throw new Error("No se encontraron rutas disponibles.");
					  		            }

					  		            return respuesta;
					  		        } catch (error) {
					  		            console.error("Error en fetch:", error);
					  		            return null; // Retorna null en caso de error
					  		        }
					  		    };

					  		    funcpeticionMOTORBIKE()
					  		        .then(respuesta => {
					  		            if (!respuesta) {
					  		                console.error("No se pudo obtener la ruta en ciclomotor.");
					  		                return;
					  		            }

					  		            // Eliminar rutas previas del mapa
					  		            if (routePolyline) {
					  		                routePolyline.forEach(item => map.removeLayer(item));
					  		            }

					  		            // Validar estructura antes de acceder a los datos
					  		            if (!respuesta.routes[0] || !respuesta.routes[0].legs[0] || !respuesta.routes[0].legs[0].steps) {
					  		                console.error("Estructura de respuesta inválida.");
					  		                return;
					  		            }

					  		            const steps = respuesta.routes[0].legs[0].steps;

					  		            steps.forEach(step => {
					  		                let color = "green"; // Color por defecto (caminar)

					  		              
											if (step.travel_mode === "DRIVING") {
											    color = "purple";
											}
											

					  		                // Decodificar el polyline de Google Maps (para obtener los puntos de la ruta)
					  		                const stepCoords = decodePolyline(step.polyline.points).map(point => [point.lat, point.lng]);

					  		                // Dibujar la polilínea del paso con el color correspondiente
					  		                routePolyline.push(L.polyline(stepCoords, { color: color, weight: 4 }).addTo(map));
					  		            });
										showGoogleMapsModal(respuesta, transporteImp);
					  		            moveToMidPointMarkers(pointA, pointB);
					  		        })
					  		        .catch(error => {
					  		            console.error("Error en la carga de estaciones:", error);
					  		        });			  
					  
	
}	
		
function muestraRutaValenbisi(){

	const urlBICI = "https://ecomovevalencia.onrender.com/api/buscaEstacionBici?Olat="+pointA.lat+"&Olng="+pointA.lng+"&Dlat="+pointB.lat+"&Dlng="+pointB.lng+"&ignoreAviabilityO=0&ignoreAviabilityD=0";

	// Función para obtener la ruta en bus
	const peticionBICI = async () => {
	    try {
	        const response = await fetch(urlBICI			, {
									 method: 'GET', // Puedes ajustar el método si es necesario
									headers: {
									"ngrok-skip-browser-warning": "true"  // Encabezado para evitar la advertencia del navegador
									}
								});
		if (!response.ok){
									
				mostrarPopupInfo(tm("ruta_valenbisi_error"), "error");
				
				throw new Error(`Error en la solicitud: ${response.status}`);
				} 

	        const respuesta = await response.json();
	        console.log("Respuesta API:", respuesta);



	        return respuesta;
	    } catch (error) {
	        console.error("Error en fetch:", error);
	        return null; // Retorna null en caso de error
	    }
	};

        peticionBICI()
            .then(respuesta => {
                        console.log(respuesta);
                if (!respuesta) {
                    console.error("No se pudo obtener la ruta en bicicleta.");
                    return;
                }

                let esEnBici = false;
                if (respuesta.bikingRoute && respuesta.bikingRoute.status === "OK") {
                    esEnBici = true;
                }

                if (esEnBici) {
                    document.getElementById("transport-select").value = "bici";
                    toggleTransport("bici");
                    sincronizarSelectorPersonalizado("bici");
                } else {
                    document.getElementById("transport-select").value = "none";
                    toggleTransport("none");
                    sincronizarSelectorPersonalizado("none");
                }

	        // Eliminar rutas previas del mapa
	        if (routePolyline) {
	            routePolyline.forEach(item => map.removeLayer(item));
	        }
	        routePolyline = [];

	        // Procesar rutas a pie hacia la estación
	        if (respuesta.walkingToStation && respuesta.walkingToStation.routes.length > 0) {
	            dibujarRuta(respuesta.walkingToStation.routes[0], "green");
	        }

	        // Procesar ruta en bicicleta
	        if (respuesta.bikingRoute && respuesta.bikingRoute.routes.length > 0) {
	            dibujarRuta(respuesta.bikingRoute.routes[0], "blue");
	        }

	        // Procesar rutas a pie desde la estación
	        if (respuesta.walkingFromStation && respuesta.walkingFromStation.routes.length > 0) {
	            dibujarRuta(respuesta.walkingFromStation.routes[0], "green");
	        }
			showGoogleMapsModal(respuesta, "");
			moveToMidPointMarkers(pointA, pointB);
	    })
	    .catch(error => {
	        console.error("Error en la carga de estaciones:", error);
	    });

	function dibujarRuta(route, color) {
	    const steps = route.legs[0].steps;
	    
	    steps.forEach(step => {
	        const stepCoords = decodePolyline(step.polyline.points).map(point => [point.lat, point.lng]);
	        routePolyline.push(L.polyline(stepCoords, { color: color, weight: 4 }).addTo(map));
	    });
	}

}


function muestraRutaTaxi(){

	const urlTAXI = "https://ecomovevalencia.onrender.com/api/buscaEstacionTaxi?Olat="+pointA.lat+"&Olng="+pointA.lng+"&Dlat="+pointB.lat+"&Dlng="+pointB.lng;

	// Función para obtener la ruta en bus
	const peticionTAXI = async () => {
	    try {
	        const response = await fetch(urlTAXI			, {
									 method: 'GET', // Puedes ajustar el método si es necesario
									headers: {
									"ngrok-skip-browser-warning": "true"  // Encabezado para evitar la advertencia del navegador
									}
								});
		if (!response.ok){
									
				//mostrarPopupInfo(tm("ruta_valenbisi_error"), "error");
				
				throw new Error(`Error en la solicitud: ${response.status}`);
				} 

	        const respuesta = await response.json();
	        console.log("Respuesta API:", respuesta);



	        return respuesta;
	    } catch (error) {
	        console.error("Error en fetch:", error);
	        return null; // Retorna null en caso de error
	    }
	};

        peticionTAXI()
            .then(respuesta => {
                        console.log(respuesta);
                if (!respuesta) {
                    console.error("No se pudo obtener la ruta en bicicleta.");
                    return;
                }

                let esEnTaxi = false;
                if (respuesta.taxi && respuesta.taxi.status === "OK") {
                    esEnTaxi = true;
                }

                if (esEnTaxi) {
                    document.getElementById("transport-select").value = "taxi";
                    toggleTransport("taxi");
                    sincronizarSelectorPersonalizado("taxi");
                } else {
                    document.getElementById("transport-select").value = "none";
                    toggleTransport("none");
                    sincronizarSelectorPersonalizado("none");
                }

	        // Eliminar rutas previas del mapa
	        if (routePolyline) {
	            routePolyline.forEach(item => map.removeLayer(item));
	        }
	        routePolyline = [];

	        // Procesar rutas a pie hacia la estación
	        if (respuesta.walkingToStation && respuesta.walkingToStation.routes.length > 0) {
	            dibujarRuta(respuesta.walkingToStation.routes[0], "green");
	        }

	        // Procesar ruta en bicicleta
	        if (respuesta.taxi && respuesta.taxi.routes.length > 0) {
	            dibujarRuta(respuesta.taxi.routes[0], "blue");
	        }


			showGoogleMapsModal(respuesta, "");
			moveToMidPointMarkers(pointA, pointB);
	    })
	    .catch(error => {
	        console.error("Error en la carga de estaciones:", error);
	    });

	function dibujarRuta(route, color) {
	    const steps = route.legs[0].steps;
	    
	    steps.forEach(step => {
	        const stepCoords = decodePolyline(step.polyline.points).map(point => [point.lat, point.lng]);
	        routePolyline.push(L.polyline(stepCoords, { color: color, weight: 4 }).addTo(map));
	    });
	}

}const showGoogleMapsModal = (data, modeType) => {
  if (!data) return;

  const existingModal = document.getElementById("googleMapsModal");
  if (existingModal) existingModal.remove();

  let totalDistance = 0;
  let totalDuration = 0;
  let totalEmissions = 0;
  const travelModes = {};

  // Diccionarios de traducción
  let modeTranslations, transitVehicleMap, modeMap, co2ModeMap;

  // === Traducciones por idioma ===
  if (idiomaActual === "es") {
    modeTranslations = { WALKING: "Andando", BICYCLING: "Bicicleta", DRIVING: modeType === "ciclomotor" ? "Ciclomotor" : "Taxi", BUS: "Autobús", METRO: "Metro", TRAIN: "Tren", TRAM: "Tranvía", HEAVY_RAIL: "Rodalia" };

    modeMap = { PATINETE: "Patinete", ELECTRIC_CAR: "Coche eléctrico", CAMION: "Camión", DIESEL_CAR: "Coche diésel", GASOLINE_CAR: "Coche de gasolina", COCHE_HIBRIDO: "Coche híbrido", COCHE_DE_HIDROGENO: "Coche de hidrógeno", ELECTRIC_MOTORBIKE: "Moto eléctrica", COMBUSTION_MOTORBIKE: "Moto de combustión", CICLOMOTOR: "Ciclomotor" };

    transitVehicleMap = { BUS: "BUS", SUBWAY: "METRO", TRAIN: "TRAIN", TRAM: "METRO", HEAVY_RAIL: "TRAIN" };

  } else if (idiomaActual === "val") {
    modeTranslations = { WALKING: "A peu", BICYCLING: "Bicicleta", DRIVING: modeType === "ciclomotor" ? "Ciclomotor" : "Taxi", BUS: "Autobús", METRO: "Metro", TRAIN: "Tren", TRAM: "Tramvia", HEAVY_RAIL: "Rodalia" };

    modeMap = { PATINETE: "Patinet", ELECTRIC_CAR: "Cotxe elèctric", CAMION: "Camió", DIESEL_CAR: "Cotxe dièsel", GASOLINE_CAR: "Cotxe de gasolina", COCHE_HIBRIDO: "Cotxe híbrid", COCHE_DE_HIDROGENO: "Cotxe d'hidrogen", ELECTRIC_MOTORBIKE: "Moto elèctrica", COMBUSTION_MOTORBIKE: "Moto de combustió", CICLOMOTOR: "Ciclomotor" };

    transitVehicleMap = { BUS: "BUS", SUBWAY: "METRO", TRAIN: "TRAIN", TRAM: "METRO", HEAVY_RAIL: "TRAIN" };

  } else {
    modeTranslations = { WALKING: "Walking", BICYCLING: "Bicycle", DRIVING: modeType === "ciclomotor" ? "Moped" : "Taxi", BUS: "Bus", METRO: "Subway", TRAIN: "Train", TRAM: "Tram", HEAVY_RAIL: "Commuter rail" };

    modeMap = { PATINETE: "Scooter", ELECTRIC_CAR: "Electric car", CAMION: "Truck", DIESEL_CAR: "Diesel car", GASOLINE_CAR: "Gasoline car", COCHE_HIBRIDO: "Hybrid car", COCHE_DE_HIDROGENO: "Hydrogen car", ELECTRIC_MOTORBIKE: "Electric motorbike", COMBUSTION_MOTORBIKE: "Combustion motorbike", CICLOMOTOR: "Moped" };

    transitVehicleMap = { BUS: "BUS", SUBWAY: "METRO", TRAIN: "TRAIN", TRAM: "METRO", HEAVY_RAIL: "TRAIN" };
  }

  const co2Factors = { DRIVING: 78.61, BUS: 49.9, METRO: 30, PATINETE: 3, TRAIN: 33, ELECTRIC_CAR: 43, DIESEL_CAR: 79.28, GASOLINE_CAR: 102.14, COMBUSTION_MOTORBIKE: 53, ELECTRIC_MOTORBIKE: 14, CICLOMOTOR: 65, COCHE_HIBRIDO: 65, COCHE_DE_HIDROGENO: 71.42, CAMION: 786, WALKING: 0, BICYCLING: 0, Valenbisi: 0 };

  const calculateCO2 = (modeKey, distanceMeters) => (distanceMeters / 1000) * (co2Factors[modeKey] || 0);

  const processRoute = (route) => {
    const leg = route.legs[0];
    totalDistance += leg.distance.value;
    leg.steps.forEach(step => {
      let modeKey = step.travel_mode;
      if (modeKey === "TRANSIT" && step.transit_details) {
        const vehicleType = step.transit_details.line.vehicle.type;
        modeKey = transitVehicleMap[vehicleType] || "TRANSIT";
      }
      if (modeMap[modeType]) modeKey = modeType;
      if (!travelModes[modeKey]) travelModes[modeKey] = { distance: 0, duration: 0, emissions: 0 };
      travelModes[modeKey].distance += step.distance.value;
      travelModes[modeKey].duration += step.duration.value;
      travelModes[modeKey].emissions += calculateCO2(modeKey, step.distance.value);
      totalDuration += step.duration.value;
      totalEmissions += calculateCO2(modeKey, step.distance.value);
    });
  };

  if (data.status === "OK") processRoute(data.routes[0]);
  else {
    if (data.walkingToStation?.status === "OK") processRoute(data.walkingToStation.routes[0]);
    if (data.taxi?.status === "OK") processRoute(data.taxi.routes[0]);
    if (data.bikingRoute?.status === "OK") processRoute(data.bikingRoute.routes[0]);
    if (data.walkingFromStation?.status === "OK") processRoute(data.walkingFromStation.routes[0]);
  }

  if (modeType === "PATINETE") totalDuration *= 0.78;

  const modal = document.createElement("div");
  modal.id = "googleMapsModal";
  modal.style = `position:fixed;${window.innerWidth<=758?"top:10vh;left:5vw;width:90vw;font-size:4vw;":"top:10vh;right:20px;width:390px;font-size:16px;"}max-height:80vh;background:white;z-index:10000;overflow-y:auto;box-shadow:0 8px 16px rgba(0,0,0,0.25);border-radius:12px;padding:20px;font-family:Arial,sans-serif;`;

  modal.innerHTML = `
    <button id="closeModal" style="position:absolute;top:10px;right:10px;width:30px;height:30px;background:#ef4444;color:white;border:none;border-radius:50%;font-size:20px;cursor:pointer;box-shadow:0 2px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">&times;</button>
    <h2 style="margin-bottom:15px;border-bottom:2px solid #10b981;padding-bottom:5px;color:#333;">${td("detalle_tramos")}</h2>
    <div style="margin-bottom:15px;line-height:1.6;">
      <p><strong>${td("distancia_total")}:</strong> ${(totalDistance/1000).toFixed(2)} km</p>
      <p><strong>${td("tiempo_total")}:</strong> ${(totalDuration/60).toFixed(0)} mins</p>
      <p><strong>${td("co2_total")}:</strong> ${totalEmissions.toFixed(2)} g</p>
    </div>
    <h3 style="margin-bottom:10px;color:#555;">${td("detalle_tramos2")}</h3>
    ${Object.keys(travelModes).map(modeKey => `
      <div style="background:#f9fafb;margin-bottom:10px;padding:10px;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.1);">
        <p><strong>${tt("modo")}:</strong> ${modeTranslations[modeKey] || modeMap[modeKey] || modeKey}</p>
        <p><strong>${tt("distancia")}:</strong> ${(travelModes[modeKey].distance/1000).toFixed(2)} km</p>
        <p><strong>${tt("tiempo")}:</strong> ${(travelModes[modeKey].duration/60).toFixed(0)} mins</p>
        <p><strong>${tt("co2")}:</strong> ${travelModes[modeKey].emissions.toFixed(2)} g</p>
      </div>`).join('')}`;

  document.body.appendChild(modal);
  document.getElementById("closeModal").onclick = () => modal.remove();
};










function muestraRutaDesdeTabla(respuesta){
	console.log(respuesta);
	
	const steps = respuesta.data.routes[0].legs[0].steps;

						let currentRouteCoords = [];
												steps.forEach(step => {
												    const stepCoords = decodePolyline(step.polyline.points).map(point => L.latLng(point.lat, point.lng));
													if(step.travel_mode === "TRANSIT"){
												   	 currentRouteCoords = currentRouteCoords.concat(stepCoords);
													}
												    // Dibujar la polilínea del paso...
												    routePolyline.push(L.polyline(stepCoords, { color: step.travel_mode === "TRANSIT" ? "blue" : "green", weight: 4 }).addTo(map));
												});



						

						showGoogleMapsModal(respuesta.data, "");
			            moveToMidPointMarkers(pointA, pointB);
	
	
}




        
			function createCustomIcon(size, letter, color) {
			
			    const colorLower = color.toLowerCase();
			    const isYellow = colorLower === "#ffff00" || colorLower === "yellow";
			
			    const textColor = isYellow ? "black" : "white";
			
			    return L.divIcon({
			        className: 'custom-icon',
			        html: `<div style="
			                    width: ${size}px;
			                    height: ${size}px;
			                    background: ${color};
			                    color: ${textColor};
			                    text-align: center;
			                    font-weight: bold;
			                    font-size: ${size / 2}px;
			                    border-radius: 50%;
			                    display: flex;
			                    align-items: center;
			                    justify-content: center;">
			                ${letter}
			            </div>`,
			        iconSize: [size, size],
			        iconAnchor: [size / 2, size / 2]
			    });
			}

		
		
		function mostrarPopupInfo(mensaje, tipo) {
		    // Elimina cualquier modal previo
		    const modalExistente = document.getElementById("info");
		    if (modalExistente) modalExistente.remove();

		    // Contenedor del modal
		    const modal = document.createElement("div");
		    modal.id = "info";
		    modal.style.position = "fixed";
		    modal.style.top = "0";
		    modal.style.left = "0";
		    modal.style.width = "100%";
		    modal.style.height = "100%";
		    modal.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
		    modal.style.display = "flex";
		    modal.style.alignItems = "center";
		    modal.style.justifyContent = "center";
		    modal.style.zIndex = "9999";
		    modal.style.backdropFilter = "blur(3px)";

		    // Contenedor del contenido
		    const modalContent = document.createElement("div");
		    modalContent.style.backgroundColor = "#ffffff";
		    modalContent.style.padding = "25px 30px";
		    modalContent.style.borderRadius = "12px";
		    modalContent.style.width = "clamp(300px, 60%, 600px)";
		    modalContent.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.2)";
		    modalContent.style.position = "relative";
		    modalContent.style.display = "flex";
		    modalContent.style.alignItems = "center";
		    modalContent.style.gap = "20px";
		    modalContent.style.opacity = "0";
		    modalContent.style.transform = "scale(0.9)";
		    modalContent.style.transition = "opacity 0.3s ease, transform 0.3s ease";

		    // Icono con imagen
		    const icono = document.createElement("img");
		    icono.style.width = "40px";
		    icono.style.height = "40px";
		    icono.style.flexShrink = "0";
		    icono.src = tipo === "error" ? "img/error.png" : "img/advertencia.png";
		    icono.alt = tipo === "error" ? "Error" : "Aviso";

		    // Mensaje
		    const textContainer = document.createElement("div");
		    textContainer.style.flex = "1";
		    textContainer.style.fontSize = "18px";
		    textContainer.style.lineHeight = "1.5";
		    textContainer.style.color = "#333";
		    textContainer.textContent = mensaje;

		    // Botón de cerrar
		    const closeButton = document.createElement("button");
		    closeButton.textContent = "✖";
		    closeButton.style.position = "absolute";
		    closeButton.style.top = "12px";
		    closeButton.style.right = "15px";
		    closeButton.style.border = "none";
		    closeButton.style.background = "transparent";
		    closeButton.style.fontSize = "18px";
		    closeButton.style.cursor = "pointer";
		    closeButton.style.color = "#666";
		    closeButton.onmouseover = () => closeButton.style.color = "#d00";
		    closeButton.onmouseout = () => closeButton.style.color = "#666";
		    closeButton.onclick = () => document.body.removeChild(modal);

		    // Ensamblar el modal
		    modalContent.appendChild(icono);
		    modalContent.appendChild(textContainer);
		    modalContent.appendChild(closeButton);
		    modal.appendChild(modalContent);
		    document.body.appendChild(modal);

		    // Animación de entrada
		    requestAnimationFrame(() => {
		        modalContent.style.opacity = "1";
		        modalContent.style.transform = "scale(1)";
		    });
		}







		
		
		
        
        let metroLines = {}; 
        const metroColors = {
            "1": "#E4BE36", 
            "2": "#B4397F", 
            "3": "#B11D2F", 
            "4": "#2B498B", 
            "5": "#4E886D", 
            "6": "#817FB3", 
            "7": "#CE7D28", 
            "8": "#96C4DA", 
            "9": "#A47E52", 
            "10": "#B6DD79" 
        };

        // Definir las estaciones de cada línea en orden
        const metroStations = {
            "1": [
            	"Castelló", "Alberic", "Massalavés", "Montortal", "L'Alcúdia", "Benimodo", "Carlet", "Ausiàs March", "Alginet", "Font Almaguer", "Espioca", "Omet", "Picassent", "Sant Ramon", "Realón", 
				"Col·legi El Vedat", "Torrent", "Pinanya", "Paiporta", "València Sud", "Sant Isidre", "Safranar", "Patraix", "Jesús", "Pl. Espanya", "Àngel Guimerà",
                "Túria", "Campanar", "Beniferri", "Empalme", "Burjassot", "Burjassot - Godella",
                "Godella", "Rocafort", "Massarrojos", "Moncada - Alfara", "Seminari - CEU",
                "Masies", "Horta Vella", "Bétera"
            ],
            "2": [
            	"Torrent Avinguda", "Torrent", "Pinanya", "Paiporta", "València Sud", "Sant Isidre", "Safranar", "Patraix", "Jesús", "Pl. Espanya", "Àngel Guimerà",
                "Túria", "Campanar", "Beniferri", "Empalme", "Cantereria", "Benimàmet",
                "Les Carolines - Fira", "Campament", "Paterna", "Santa Rita", "Fuente del Jarro",
                "Font del Barranc", "La Canyada", "La Vallesa", "Entrepins", "El Clot", "Montesol",
                "L'Eliana", "Gallipont - Torre del Virrei", "La Pobla de Vallbona",
                "Fondo de Benaguasil", "Benaguasil", "Llíria"
            ],
            "3": [
                "Aeroport", "Roses", "Manises", "Salt de l'Aigua", "Quart de Poblet", "Faitanar", 
                "Mislata Almassil", "Mislata", "Nou d'Octubre", "Av. del Cid", "Àngel Guimerà", 
                "Xàtiva", "Colón", "Alameda", "Facultats - Manuel Broseta", "Benimaclet", "Machado", 
                "Alboraia Palmaret", "Alboraia Peris Aragó", "Almàssera", "Meliana", "Foios", 
                "Albalat dels Sorells", "Museros", "Massamagrell", "La Pobla de Farnals", "Rafelbunyol"
            ],

            "4": [
                "Dr. Lluch", "Platja les Arenes", "Cabanyal", "Platja Malva-rosa", "La Cadena", 
                "Beteró", "Tarongers - Ernest Lluch", "La Carrasca", "Universitat Politècnica", 
                "Vicente Zaragozá", "Benimaclet", "Trinitat", "Pont de Fusta", "Sagunt", "Reus", 
                "Marxalenes", "Trànsits", "Benicalap", "Garbí", "Florista", "Palau de Congressos", 
                "Empalme", "La Granja", "Sant Joan", "Campus", "Vicent Andrés Estellés", "À Punt", 
                "Fira València", "Ll. Llarga - Terramelar", "Parc Científic", "Tomás y Valiente", 
                "La Coma", "Mas del Rosari"
            ],
            "5": [
                "Aeroport", "Roses", "Manises", "Salt de l'Aigua", "Quart de Poblet", "Faitanar", 
                "Mislata Almassil", "Mislata", "Nou d'Octubre", "Av. del Cid", "Àngel Guimerà", 
                "Xàtiva", "Colón", "Alameda", "Aragó", "Amistat", "Ayora", "Marítim"
            ],
            "6": [
                "Marítim", "Francesc Cubells", "Grau - La Marina", "Canyamelar", "Dr. Lluch", 
                "Cabanyal", "Platja les Arenes", "Platja Malva-rosa", "La Cadena", "Beteró", 
                "Tarongers - Ernest Lluch", "La Carrasca", "Universitat Politècnica", 
                "Vicente Zaragozá", "Benimaclet", "Trinitat", "Alfauir", "Orriols", 
                "Estadi Ciutat de València", "Sant Miquel dels Reis", "Tossal del Rei"
            ],
            "7": [
            	"Torrent Avinguda", "Torrent", "Pinanya", "Paiporta", "València Sud", "Sant Isidre", "Safranar", "Patraix", "Jesús", "Bailén", "Colón", "Alameda", 
                "Aragó", "Amistat", "Ayora", "Marítim"
            ],
            
            "8": [
                "Marítim", "Francesc Cubells", "Grau - La Marina", "Neptú"
                ],
            "9": [
                "Riba-roja de Túria", "Masia de Traver", "València la Vella", "La Presa", "La Cova", 
                "Roses", "Manises", "Salt de l'Aigua", "Quart de Poblet", "Faitanar", "Mislata Almassil", 
                "Mislata", "Nou d'Octubre", "Av. del Cid", "Àngel Guimerà", "Xàtiva", "Colón", 
                "Alameda", "Facultats - Manuel Broseta", "Benimaclet", "Machado", "Alboraia Palmaret", 
                "Alboraia Peris Aragó"
            ],
            "10": [
                "Bailén", "Alacant", "Russafa", "Amado Granell - Montolivet", "Quatre Carreres", 
                "Ciutat Arts i Ciències - Justícia", "Oceanogràfic", "Moreres", "Natzaret"
            ]

        };

       


		function updateCustomSelector(value) {
		    const options = document.querySelectorAll('.custom-select-option');
		    const selectedOptionText = document.getElementById('selected-option-text');
		    const selectIcon = document.getElementById('select-icon');

		    options.forEach(opt => {
		        if (opt.getAttribute('data-value') === value) {
		            opt.classList.add('selected');
		            selectedOptionText.textContent = opt.querySelector('span').textContent;
		            const icon = opt.querySelector('i').getAttribute('data-lucide');
		            document.querySelector('#select-header i').setAttribute('data-lucide', icon);
		            lucide.createIcons();
		        } else {
		            opt.classList.remove('selected');
		        }
		    });

		    // Cerrar opciones visualmente
		    const selectOptions = document.getElementById('select-options');
		    selectOptions.style.display = 'none';
		    selectIcon.setAttribute('data-lucide', 'chevron-up');
		    lucide.createIcons();
		}

		function toggleTransport(selectedType, routeCoords = null) {
		    console.log("Filtrando transporte:", selectedType);

		    markers.forEach(marker => map.removeLayer(marker));
		    metroLinesPolylines.forEach(polyline => map.removeLayer(polyline));

		    markers = [];
		    metroLinesPolylines = [];

		    if (selectedType !== "none") {
		        pendingMarkers.forEach(marker => {
		            if (marker.tipo === selectedType) {
		                if (selectedType === "bus" && routeCoords) {
		                    if (isMarkerNearRoute(marker, routeCoords)) {
		                        marker.addTo(map);
		                        markers.push(marker);
		                    }
		                } else {
		                    marker.addTo(map);
		                    markers.push(marker);
		                }
		            }
		        });

		        if (selectedType === "metro") {
		            pendingPolylines.forEach(polyline => {
		                polyline.addTo(map);
		                metroLinesPolylines.push(polyline);
		            });
		        }
		    }
		}
		
		document.getElementById('transport-select').addEventListener('change', function() {
		    const selectedType = this.value;
		    toggleTransport(selectedType);
		    sincronizarSelectorPersonalizado(selectedType);
		});

		function sincronizarSelectorPersonalizado(value) {
		    const opciones = document.querySelectorAll('.custom-select-option');
		    const textoSeleccionado = document.getElementById('selected-option-text');


		    opciones.forEach(opcion => {
		        if (opcion.getAttribute('data-value') === value) {
		            opcion.classList.add('selected');
		            textoSeleccionado.textContent = opcion.querySelector('span').textContent;


		        } else {
		            opcion.classList.remove('selected');
		        }
		    });

		    // Cierra visualmente las opciones si estaban abiertas
		    document.getElementById('select-options').style.display = 'none';
		    document.getElementById('select-icon').setAttribute('data-lucide', 'chevron-up');

		    lucide.createIcons(); // refresca iconos Lucide inmediatamente
		}



		
		function isMarkerNearRoute(marker, routeCoords, threshold = 5) {
		    let markerLatLng = marker.getLatLng();
		    // Convertir la posición del marcador a coordenadas de capa
		    let markerPoint = map.latLngToLayerPoint(markerLatLng);
		    
		    for (let i = 0; i < routeCoords.length - 1; i++) {
		        let start = map.latLngToLayerPoint(routeCoords[i]);
		        let end = map.latLngToLayerPoint(routeCoords[i + 1]);
		        // Usamos el método de Leaflet para calcular la distancia de un punto a un segmento
		        let distance = L.LineUtil.pointToSegmentDistance(markerPoint, start, end);
		        if (distance < threshold) {
		            return true;
		        }
		    }
		    return false;
		}


        let metroLinesPolylines = []; // Guardamos aquí las líneas dibujadas

  


        // Al cargar, todo está oculto por defecto
        
		let pendingMarkers = []; // Array temporal para almacenar marcadores antes de mostrarlos
		let pendingPolylines = []; // Array para líneas de metro antes de mostrarlas

		function loadAllMetroStations(url) {
		    return fetch(url, {
		        method: 'GET', // Puedes ajustar el método si es necesario
		        headers: {
		            "ngrok-skip-browser-warning": "true"  // Encabezado para evitar la advertencia del navegador
		        }
		    })
		    .then(response => response.json())
		    .then(stations => processMetroStations(stations))
		    .catch(error => console.error("Error loading metro stations:", error));
		}


		var metroCoordinates = {};
		var stationUsage = {};

		function processMetroStations(stations) {
		    // Reiniciar estructuras de datos
		    metroCoordinates = {};
		    stationUsage = {};

		    Object.keys(metroStations).forEach(linea => {
		        metroCoordinates[linea] = [];
		    });

		    stations.forEach(station => {
		        var lat = station.geo_point_2d.lat;
		        var lon = station.geo_point_2d.lon;
		        var name = station.nombre;
		        var proximasLlegadas = station.proximas_llegadas;
		        var lineas = station.linea.split(",").map(l => l.trim()); // Convertir en array

		        var marker = L.marker([lat, lon], {
		            icon: createCustomIcon(20, "M", "red")
		        }).bindPopup(`<strong>${name}</strong><br><a href='${proximasLlegadas}' target='_blank'>Próximas llegadas</a>`);

		        marker.tipo = "metro";
		        pendingMarkers.push(marker);

		        if (!stationUsage[name]) {
		            stationUsage[name] = { name, lat, lon, lines: [] };
		        }

		        lineas.forEach(linea => {
		            if (!metroStations[linea]) {
		                console.warn(`Línea ${linea} no está definida en metroStations`);
		                return;
		            }

		            if (!stationUsage[name].lines.includes(linea)) {
		                stationUsage[name].lines.push(linea);
		            }

		            if (!metroCoordinates[linea]) {
		                metroCoordinates[linea] = [];
		            }

		            // Evitar duplicados en metroCoordinates[linea]
		            if (!metroCoordinates[linea].some(st => st.name === name)) {
		                metroCoordinates[linea].push({ name, lat, lon });
		            }
		        });
		    });

		    // **Asegurar que las estaciones sigan el orden de metroStations**
			Object.keys(metroCoordinates).forEach(linea => {
			    if (metroStations[linea]) {
			        // Crear un nuevo array donde las estaciones se ordenarán según metroStations
			        let orderedStations = metroStations[linea]
			            .map(stationName => metroCoordinates[linea].find(st => st.name === stationName))
			            .filter(st => st); // Filtrar estaciones que existen en metroCoordinates

			        metroLines[linea] = orderedStations;
			    }
			});



		    drawMetroLines();
		}






		function drawMetroLines() {
		  pendingPolylines = []; // Reiniciar el array antes de dibujar

		  // 1. Contar la cantidad de apariciones de cada coordenada en todas las líneas
		  var coordinateCounts = {};
		  Object.keys(metroLines).forEach(function(linea) {
		    metroLines[linea].forEach(function(coord) {
		      var key = coord.lat + "," + coord.lon;
		      coordinateCounts[key] = (coordinateCounts[key] || 0) + 1;
		    });
		  });

		  // Objeto para llevar el seguimiento del offset aplicado en cada coordenada
		  var positionOffset = {};

		  // 2. Dibujar cada línea aplicando offset solo en coordenadas compartidas por más de una línea
		  Object.keys(metroLines).forEach(function(linea) {
		    if (metroLines[linea].length > 1) {
		      var coordinates = metroLines[linea];
		      var color = metroColors[linea] || "#000";

		      var adjustedCoordinates = coordinates.map(function(coord) {
		        var key = coord.lat + "," + coord.lon;
		        // Si la coordenada solo aparece en una línea, no se aplica offset
		        if (coordinateCounts[key] === 1) {
		          return { lat: coord.lat, lon: coord.lon };
		        }

		        // Si la coordenada es compartida, aplicamos un offset distinto para cada ocurrencia
		        if (!positionOffset[key]) {
		          positionOffset[key] = 0;
		        }
		        var offsetIndex = positionOffset[key]++;
		        var offsetAmount = 0.0010; // Ajusta el valor si es necesario
		        var angle = offsetIndex * (Math.PI / 6); // Variar dirección según la ocurrencia
		        var latOffset = Math.sin(angle) * offsetAmount;
		        var lonOffset = Math.cos(angle) * offsetAmount;

		        return { lat: coord.lat + latOffset, lon: coord.lon + lonOffset };
		      });

		      var polyline = L.polyline(
		        adjustedCoordinates.map(function(coord) { return [coord.lat, coord.lon]; }),
		        {
		          color: color,
		          weight: 7,
		          opacity: 1
		        }
		      );

		      pendingPolylines.push(polyline); // Guardar la polilínea en el array temporal
		    }
		  });
		}



 
		function loadBusStations(url) {
		    return fetch(url)
		        .then(response => response.json())
		        .then(data => {
		            data.forEach(station => {
		                let lat = station.geo_point_2d.lat;
		                let lon = station.geo_point_2d.lon;
		                let denominacion = station.denominacion;
		                let lineas = station.lineas;
		                let proximasLlegadas = station.proximas_llegadas;

		                let marker = L.marker([lat, lon], {
		                    icon: createCustomIcon(20, "B", "green"),
		                }).bindPopup(`<strong>${denominacion}</strong><br> Líneas: ${lineas}<br><a href="${proximasLlegadas}" target="_blank">Próximas llegadas</a>`);

		                marker.tipo = "bus";
		                pendingMarkers.push(marker); // Guardar en el array temporal
		            });
		        })
		        .catch(error => console.error("Error al cargar estaciones de autobús:", error));
				}
				
				
				function loadRodaliaStations(url) {
				    return fetch(url)
				        .then(response => response.json())
				        .then(data => {
				            data.forEach(station => {
				                if (station.geo_point_2d && station.geo_point_2d.lat && station.geo_point_2d.lon) {
				                    let lat = parseFloat(station.geo_point_2d.lat);
				                    let lon = parseFloat(station.geo_point_2d.lon);
				                    let nombre = station.descripci || "Estación desconocida";

				                    let marker = L.marker([lat, lon], {
				                        icon: createCustomIcon(20, "R", "orange"),
				                    }).bindPopup(`<strong>${nombre}</strong>`);

				                    marker.tipo = "rodalia";
				                    pendingMarkers.push(marker); // Guardar en el array temporal
				                }
				            });
				        })
				        .catch(error => console.error("Error al cargar estaciones de rodalia:", error));
				}
				
				
				function loadTaxiStations(url) {
				    return fetch(url)
				        .then(response => response.json())						
				        .then(data => {
							console.log(data);
				            data.forEach(station => {
				                if (station.lat && station.lon && station.calle) {
				                    let lat = parseFloat(station.lat);
				                    let lon = parseFloat(station.lon);
				                    let nombre = station.calle || "Estación desconocida";

				                    let marker = L.marker([lat, lon], {
				                        icon: createCustomIcon(20, "T", "yellow"),
				                    }).bindPopup(`<strong>${nombre}</strong>`);

				                    marker.tipo = "taxi";
				                    pendingMarkers.push(marker); // Guardar en el array temporal
				                }
				            });
				        })
				        .catch(error => console.error("Error al cargar estaciones de taxi:", response));
				}



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

		                    let marker = L.marker([lat, lon], {
		                        icon: createCustomIcon(20, "V", "blue"),
		                    }).bindPopup(`<strong>${address}</strong><br>Bicis disponibles: ${available} / ${total}`);

		                    marker.tipo = "bici";
		                    pendingMarkers.push(marker); // Guardar en el array temporal

		                   
		                    valenbisiStations.push({ lat, lon, address, available, total });
		                });
		            }
		        })
		        .catch(error => console.error("Error al cargar estaciones de Valenbisi:", error));
		}


const originInput = document.getElementById("origin-input");
const destinationInput = document.getElementById("destination-input");

let originAutocomplete;
let destinationAutocomplete;
let directionsService;
let distanceService;

function initGoogleApis() {
    directionsService = new google.maps.DirectionsService();
    distanceService = new google.maps.DistanceMatrixService();
    originAutocomplete = new google.maps.places.Autocomplete(originInput);
    destinationAutocomplete = new google.maps.places.Autocomplete(destinationInput);
}

if (window.google && window.google.maps && window.google.maps.places) {
    initGoogleApis();
} else {
    window.addEventListener('google-maps-loaded', initGoogleApis);
}

const minLat = 39.00, maxLat = 39.9;
const minLng = -0.75, maxLng = 0.1;

function isWithinBounds(latlng) {
    return (
        latlng.lat >= minLat && latlng.lat <= maxLat &&
        latlng.lng >= minLng && latlng.lng <= maxLng
    );
}

// Cuando se hace click en el botón "Establecer dirección"
document.getElementById("set-directions").addEventListener("click", function() {
	
	
	console.log(window.innerWidth);
	if (window.innerWidth <= 768) {	
	const box = document.getElementById("buscadorBox");
	box.style.display = box.style.display === "none" || box.style.display === "" ? "flex" : "none";
	console.log("debe borrar")
	}
	
  const originAddress = originInput.value;
  const destinationAddress = destinationInput.value;
  distancia_total = 0;
  segundos_total = 0;
  
  const modal = document.getElementById("googleMapsModal");
  if (modal) modal.remove();
  
   if (routePolyline) {
   	  routePolyline.forEach(item => {
   	    map.removeLayer(item);
   	  });
         routePolyline = [];
   	}
   
  if (!originAddress || !destinationAddress) {
    mostrarPopupInfo(tm("selecciona_dos_puntos"), "error");
    return;
  }

  const geocoder = new google.maps.Geocoder();

  // Geocode para la dirección de origen
  geocoder.geocode({ address: originAddress }, function(results, status) {//
    if (status === google.maps.GeocoderStatus.OK && results[0]) {
      const originLocation = results[0].geometry.location;
      // Convierte la posición de Google a un objeto LatLng de Leaflet
      pointA = L.latLng(originLocation.lat(), originLocation.lng());

      // Si ya existe un marker, se elimina
      if (markerA) {
        map.removeLayer(markerA);
      }
      
      if (!isWithinBounds(pointA)) {
          mostrarPopupInfo(tm("fuera_limites_origen"), "error");
          return;
      }
      
      markerA = createMarker(pointA, "red");

      // Geocode para la dirección de destino
      geocoder.geocode({ address: destinationAddress }, function(results2, status2) {
        if (status2 === google.maps.GeocoderStatus.OK && results2[0]) {
          const destinationLocation = results2[0].geometry.location;
          pointB = L.latLng(destinationLocation.lat(), destinationLocation.lng());

          
          if (!isWithinBounds(pointB)) {
               mostrarPopupInfo(tm("fuera_limites_destino"), "error");
              return;
          }
	        
          if (markerB) {
            map.removeLayer(markerB);
          }
          markerB = createMarker(pointB, "blue");

          document.getElementById("distance-info").innerText = "Origen y destino establecidos.";
          // Centrar el mapa entre ambos puntos
          moveToMidPointMarkers(pointA, pointB);

          // Opcional: Llama a la función para calcular/dibujar la ruta según la opción de transporte
          seleccionaOpcionTransporte();
        } else {
           mostrarPopupInfo(tm("selecciona_destino"), "error");
        }
      });
    } else {
      mostrarPopupInfo(tm("selecciona_origen"), "error");
    }
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const banderas = document.querySelectorAll(".bandera");

  banderas.forEach(bandera => {
    bandera.addEventListener("click", () => {
      const nuevaLang = bandera.classList.contains("esp") ? "es" :
                        bandera.classList.contains("val") ? "val" :
                        bandera.classList.contains("en") ? "en" : "es";

      localStorage.setItem("idioma", nuevaLang);
      location.reload(); // recarga para aplicar el idioma
    });
  });
  
  const optionKey = {
    none:    'mapa_simple',
    metro:   'metro',
    bus:     'bus',
    bici:    'valenbisi',
    rodalia: 'rodalia',
    taxi:    'Taxi'
  };

  // 1) Traducir el <select> nativo
  const select = document.getElementById('transport-select');
  Array.from(select.options).forEach(opt => {
    const key = optionKey[opt.value];
    if (key) opt.textContent = t(key);
  });

  // 2) Traducir el selector personalizado
  document.querySelectorAll('.custom-select-option').forEach(opt => {
    const val = opt.getAttribute('data-value');
    const key = optionKey[val];
    if (key) {
      opt.querySelector('span').textContent = t(key);
    }
  });

  // 3) Ajustar el header para que muestre la opción por defecto traducida
  const headerText = document.getElementById('selected-option-text');
  const currentKey = optionKey[select.value];
  if (currentKey) headerText.textContent = t(currentKey);

  // Añadir clase 'seleccionado' a la bandera activa
  banderas.forEach(b => b.classList.remove("seleccionado"));
  const mapIdiomaAClase = { es: "esp", val: "val", en: "en" };
  const activa = document.querySelector(`.bandera.${mapIdiomaAClase[idiomaActual]}`);
  if (activa) activa.classList.add("seleccionado");
});




// Traducción del label del selector
//document.getElementById("transpsel").innerText = t("seleccionar_vista");

// Traducción de las opciones del select
const select = document.getElementById("transport-select");
select.options[0].text = t("mapa_simple");
select.options[1].text = t("metro");
select.options[2].text = t("bus");
select.options[3].text = t("valenbisi");
select.options[4].text = t("rodalia");

// Traducción de los placeholders
document.getElementById("origin-input").placeholder = t("origen");
document.getElementById("destination-input").placeholder = t("destino");



document.getElementById("btnMostrarModal").innerText = t("mostrar_tabla");
document.getElementById("btnRepetirOrigenDestino").innerText = t("repetir");




function loadAllData() {


	var promises = [
	     
		   loadAllMetroStations("https://ecomovevalencia.onrender.com/api/getMetro"),		  
	       loadBusStations("https://ecomovevalencia.onrender.com/api/getBus"),
		   loadRodaliaStations("https://ecomovevalencia.onrender.com/api/getRodalia"),
		   loadTaxiStations("https://ecomovevalencia.onrender.com/api/getTaxis"),
	       loadValenBisiStations("https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/valenbisi-disponibilitat-valenbisi-dsiponibilidad/records?limit=100"),
	       loadValenBisiStations("https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/valenbisi-disponibilitat-valenbisi-dsiponibilidad/records?limit=100&offset=100"),
	       loadValenBisiStations("https://valencia.opendatasoft.com/api/explore/v2.1/catalog/datasets/valenbisi-disponibilitat-valenbisi-dsiponibilidad/records?limit=73&offset=200")
	   ];

    Promise.all(promises).then(function() {
        console.log("Todas las estaciones cargadas, ocultando transportes");
        toggleTransport("none");
		sincronizarSelectorPersonalizado("none")
		
    }).catch(function(error) {
        console.error("Error al cargar datos:", error);
    });
}

// Llamar a la función
loadAllData();

