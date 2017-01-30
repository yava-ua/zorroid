#Ticket to Ride


## Build: 
```
npm install
npm install -g http-server
```
## Run:
```
gulp
http-server
```

## Generating maps

###Black sea countries map
```
ogr2ogr -f GeoJSON -where "ADM0_A3 in ('UKR', 'MDA', 'ROU', 'HUN', 'POL', 'SVK', 'MNE', 'SRB', 'BIH', 'KOS', 'MKD','BGR', 'ALB', 'GRC', 'TUR', 'GEO', 'ARM', 'AZE', 'RUS')" countries-black-sea.json ne_10m_admin_0_map_subunits\ne_10m_admin_0_map_subunits.shp
ogr2ogr -f GeoJSON -where "ADM0_A3 in ('UKR', 'MDA', 'ROU', 'HUN', 'POL', 'SVK', 'MNE', 'SRB', 'BIH', 'KOS', 'MKD','BGR', 'ALB', 'GRC', 'TUR', 'GEO', 'ARM', 'AZE', 'RUS') and Scalerank <= 6" cities-black-sea.json ne_10m_populated_places\ne_10m_populated_places.shp
geo2topo countries=countries-black-sea.json cities=cities-black-sea.json > black-sea.json
```
###Globe Map
```
ogr2ogr -f GeoJSON countries-globe.json ne_10m_admin_0_map_subunits\ne_10m_admin_0_map_subunits.shp
ogr2ogr -f GeoJSON -where "Scalerank <= 6" cities-globe.json ne_10m_populated_places\ne_10m_populated_places.shp
geo2topo countries=countries-globe.json cities=cities-globe.json > globe.json
```

### Map quantization & simplification
topoquantize -o bl1_q.json 1e4 black-sea.json


###Map complete world example
ogr2ogr -f GeoJSON world.json ne_10m_admin_0_map_subunits\ne_10m_admin_0_map_subunits.shp
ogr2ogr -f GeoJSON -where "Scalerank <= 3" world-cities.json ne_10m_populated_places\ne_10m_populated_places.shp
geo2topo countries=world.json cities=world-cities.json > world_complete.json
topoquantize 1e4 -o world_cq.json world_complete.json
toposimplify -p 0.02 -o world_cqs.json world_cq.json
