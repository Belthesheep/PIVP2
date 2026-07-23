"""
Utilidades para soporte de eliminación lógica (soft deletes)
Proporciona funciones auxiliares para filtrar registros eliminados
"""

from datetime import datetime

# Claúsulas WHERE para filtrar eliminación lógica
SOFT_DELETE_FILTERS = {
    "posts": "p.deleted_at IS NULL",
    "users": "u.deleted_at IS NULL",
    "pools": "pl.deleted_at IS NULL",
    "tags": "t.is_deleted = 0"
}

def get_soft_delete_where_clause(table_alias: str, table_name: str) -> str:
    """
    Obtiene la cláusula WHERE para un filtro de eliminación lógica
    
    Args:
        table_alias: Alias de la tabla en la consulta (ej: 'p', 'u')
        table_name: Nombre de la tabla (ej: 'posts', 'users')
    
    Returns:
        Cláusula WHERE apropiada para filtrar eliminados
    """
    if table_name == "posts":
        return f"{table_alias}.deleted_at IS NULL"
    elif table_name == "users":
        return f"{table_alias}.deleted_at IS NULL"
    elif table_name == "pools":
        return f"{table_alias}.deleted_at IS NULL"
    elif table_name == "tags":
        return f"{table_alias}.is_deleted = 0"
    return ""

def build_soft_delete_update(table_name: str, id_column: str, record_id: int) -> tuple:
    """
    Construye una sentencia UPDATE para eliminación lógica en lugar de DELETE
    
    Args:
        table_name: Nombre de la tabla
        id_column: Nombre de la columna ID
        record_id: ID del registro a eliminar lógicamente
    
    Returns:
        Tupla (sentencia_sql, parámetros)
    """
    timestamp = datetime.now().isoformat()
    
    if table_name == "tags":
        # Tags usan is_deleted en lugar de deleted_at
        sql = f"UPDATE {table_name} SET is_deleted = 1 WHERE {id_column} = ?"
        return (sql, (record_id,))
    else:
        # Otros usan deleted_at
        sql = f"UPDATE {table_name} SET deleted_at = ? WHERE {id_column} = ?"
        return (sql, (timestamp, record_id))

def build_restore_delete_record(table_name: str, id_column: str, record_id: int) -> tuple:
    """
    Construye una sentencia UPDATE para restaurar un registro eliminado lógicamente
    
    Args:
        table_name: Nombre de la tabla
        id_column: Nombre de la columna ID
        record_id: ID del registro a restaurar
    
    Returns:
        Tupla (sentencia_sql, parámetros)
    """
    if table_name == "tags":
        sql = f"UPDATE {table_name} SET is_deleted = 0 WHERE {id_column} = ?"
    else:
        sql = f"UPDATE {table_name} SET deleted_at = NULL WHERE {id_column} = ?"
    
    return (sql, (record_id,))

def get_deleted_records_filter(table_name: str, table_alias: str = None) -> str:
    """
    Obtiene cláusula WHERE para consultar SOLO registros eliminados (para admins)
    """
    if table_alias is None:
        table_alias = table_name[0]  # Usa la primera letra como alias por defecto
    
    if table_name == "tags":
        return f"{table_alias}.is_deleted = 1"
    else:
        return f"{table_alias}.deleted_at IS NOT NULL"
