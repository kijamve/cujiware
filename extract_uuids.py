import re
import json
from collections import Counter

def extract_uuids(file_path):
    # Patrón regex para UUIDs
    uuid_pattern = r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
    
    # Leer el archivo
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Encontrar todos los UUIDs
    uuids = re.findall(uuid_pattern, content)
    
    # Encontrar duplicados
    uuid_counter = Counter(uuids)
    duplicates = {uuid: count for uuid, count in uuid_counter.items() if count > 1}
    
    # Eliminar duplicados manteniendo el orden
    unique_uuids = list(dict.fromkeys(uuids))
    
    # Guardar los UUIDs en un archivo JSON
    with open('extracted_uuids.json', 'w', encoding='utf-8') as f:
        json.dump({
            'unique_uuids': unique_uuids,
            'duplicates': duplicates
        }, f, indent=2)
    
    print(f"Se encontraron {len(unique_uuids)} UUIDs únicos")
    if duplicates:
        print(f"Se encontraron {len(duplicates)} UUIDs duplicados")
        print("\nUUIDs duplicados en el archivo original:")
        for uuid, count in duplicates.items():
            print(f"- {uuid}: aparece {count} veces")
    
    return unique_uuids, duplicates

def validate_uuids_in_migrate(extracted_uuids, original_duplicates, migrate_file):
    # Leer el archivo migrate.json
    with open(migrate_file, 'r', encoding='utf-8') as f:
        migrate_data = json.load(f)
    
    # Extraer todos los UUIDs de migrate.json
    migrate_uuids = []
    for customer in migrate_data:
        if 'licenses' in customer:
            migrate_uuids.extend(customer['licenses'])
    
    # Encontrar duplicados en migrate.json
    migrate_counter = Counter(migrate_uuids)
    migrate_duplicates = {uuid: count for uuid, count in migrate_counter.items() if count > 1}
    
    # Encontrar UUIDs que no están en migrate.json
    missing_uuids = [uuid for uuid in extracted_uuids if uuid not in migrate_uuids]
    
    # Encontrar UUIDs que están en migrate.json pero no en el archivo original
    extra_uuids = [uuid for uuid in migrate_uuids if uuid not in extracted_uuids]
    
    # Guardar los resultados en un archivo
    results = {
        'total_extracted': len(extracted_uuids),
        'total_in_migrate': len(migrate_uuids),
        'missing_in_migrate': missing_uuids,
        'extra_in_migrate': extra_uuids,
        'duplicates_in_original': original_duplicates,
        'duplicates_in_migrate': migrate_duplicates
    }
    
    with open('uuid_validation_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    print("\nResultados de la validación:")
    print(f"Total UUIDs extraídos: {len(extracted_uuids)}")
    print(f"Total UUIDs en migrate.json: {len(migrate_uuids)}")
    print(f"UUIDs faltantes en migrate.json: {len(missing_uuids)}")
    print(f"UUIDs extra en migrate.json: {len(extra_uuids)}")
    
    if migrate_duplicates:
        print("\nUUIDs duplicados en migrate.json:")
        for uuid, count in migrate_duplicates.items():
            print(f"- {uuid}: aparece {count} veces")
    
    if missing_uuids:
        print("\nUUIDs que faltan en migrate.json:")
        for uuid in missing_uuids:
            print(f"- {uuid}")
    
    if extra_uuids:
        print("\nUUIDs extra en migrate.json:")
        for uuid in extra_uuids:
            print(f"- {uuid}")

if __name__ == "__main__":
    file_path = "migrate-customers.js"
    migrate_file = "migrate.json"
    
    # Extraer UUIDs
    uuids, duplicates = extract_uuids(file_path)
    
    # Validar UUIDs contra migrate.json
    validate_uuids_in_migrate(uuids, duplicates, migrate_file) 