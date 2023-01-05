/**
 * @module extension/relatedTables
 */
import { RelationType } from './relationType';

/**
 * Describes the relationships between a base table, a related data table, and a mapping table
 * @class ExtendedRelation
 */
export class ExtendedRelation {
  /**
   * Table name
   */
  public static readonly TABLE_NAME = 'gpkgext_relations';

  /**
   * id field name
   */
  public static readonly COLUMN_ID = 'id';

  /**
   * base_table_name field name
   */
  public static readonly COLUMN_BASE_TABLE_NAME = 'base_table_name';

  /**
   * base_primary_column field name
   */
  public static readonly COLUMN_BASE_PRIMARY_COLUMN = 'base_primary_column';

  /**
   * related_table_name field name
   */
  public static readonly COLUMN_RELATED_TABLE_NAME = 'related_table_name';

  /**
   * related_primary_column field name
   */
  public static readonly COLUMN_RELATED_PRIMARY_COLUMN = 'related_primary_column';

  /**
   * relation_name field name
   */
  public static readonly COLUMN_RELATION_NAME = 'relation_name';

  /**
   * mapping_table_name field name
   */
  public static readonly COLUMN_MAPPING_TABLE_NAME = 'mapping_table_name';

  /**
   * Extended Relations primary key
   */
  private id: number;

  /**
   * Name of the table containing the base data (e.g., features) to relate
   */
  private base_table_name: string;

  /**
   * Name of the primary key column in base_table_name
   */
  private base_primary_column: string;

  /**
   * Name of the table containing the related information
   */
  private related_table_name: string;

  /**
   * Name of the primary key column in related_table_name
   */
  private related_primary_column: string;

  /**
   * Name of the relation
   */
  private relation_name: string;

  /**
   * Name of a mapping table
   */
  private mapping_table_name: string;

  /**
   * Default Constructor
   */
  public constructor();

  /**
   * Copy Constructor
   * @param extendedRelation extended relation to copy
   */
  public constructor(extendedRelation: ExtendedRelation);

  /**
   * Constructor
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1 && args[0] instanceof ExtendedRelation) {
      const extendedRelation = args[0];
      this.id = extendedRelation.getId();
      this.base_table_name = extendedRelation.getBaseTableName();
      this.base_primary_column = extendedRelation.getBasePrimaryColumn();
      this.related_table_name = extendedRelation.getRelatedTableName();
      this.related_primary_column = extendedRelation.getRelatedPrimaryColumn();
      this.relation_name = extendedRelation.getRelationName();
      this.mapping_table_name = extendedRelation.getMappingTableName();
    }
  }

  /**
   * Getter
   *
   * @return the id
   */
  public getId(): number {
    return this.id;
  }

  /**
   * Setter
   *
   * @param id
   *            id
   */
  public setId(id: number): void {
    this.id = id;
  }

  /**
   * Reset the id so the row can be inserted as new
   */
  public resetId(): void {
    this.id = 0;
  }

  /**
   * Getter
   *
   * @return the base table name
   */
  public getBaseTableName(): string {
    return this.base_table_name;
  }

  /**
   * Setter
   *
   * @param baseTableName
   *            base table name
   */
  public setBaseTableName(baseTableName: string): void {
    this.base_table_name = baseTableName;
  }

  /**
   * Getter
   *
   * @return the name of the primary column of the base table
   */
  public getBasePrimaryColumn(): string {
    return this.base_primary_column;
  }

  /**
   * Setter
   *
   * @param basePrimaryColumn
   *            base primary column
   */
  public setBasePrimaryColumn(basePrimaryColumn: string): void {
    this.base_primary_column = basePrimaryColumn;
  }

  /**
   * Getter
   *
   * @return the name of the related table
   */
  public getRelatedTableName(): string {
    return this.related_table_name;
  }

  /**
   * Setter
   *
   * @param relatedTableName
   *            related table name
   */
  public setRelatedTableName(relatedTableName: string): void {
    this.related_table_name = relatedTableName;
  }

  /**
   * Getter
   *
   * @return the name of the primary column of the related table
   */
  public getRelatedPrimaryColumn(): string {
    return this.related_primary_column;
  }

  /**
   * Setter
   *
   * @param relatedPrimaryColumn
   *            related primary column
   */
  public setRelatedPrimaryColumn(relatedPrimaryColumn: string): void {
    this.related_primary_column = relatedPrimaryColumn;
  }

  /**
   * Getter
   *
   * @return the relation name
   */
  public getRelationName(): string {
    return this.relation_name;
  }

  /**
   * Get the relation type for pre-known types
   *
   * @return relation type or null
   */
  public getRelationType(): RelationType {
    return RelationType.fromName(this.getRelationName());
  }

  /**
   * Setter
   *
   * @param relationName
   *            relation name
   */
  public setRelationName(relationName: string): void {
    this.relation_name = relationName;
  }

  /**
   * Getter
   *
   * @return the mapping table name
   */
  public getMappingTableName(): string {
    return this.mapping_table_name;
  }

  /**
   * Setter
   *
   * @param mappingTableName
   *            mapping table name
   */
  public setMappingTableName(mappingTableName: string): void {
    this.mapping_table_name = mappingTableName;
  }
}
