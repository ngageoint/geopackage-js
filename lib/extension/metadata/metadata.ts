/**
 * Contains metadata in MIME encodings structured in accordance with any
 * authoritative metadata specification
 * @class Metadata
 */
import { MetadataScopeType } from './metadataScopeType';

export class Metadata {
  /**
   * Table name
   */
  public static readonly TABLE_NAME: string = 'gpkg_metadata';

  /**
   * id field name
   */
  public static readonly COLUMN_ID: string = 'id';

  /**
   * scope field name
   */
  public static readonly COLUMN_SCOPE: string = 'md_scope';

  /**
   * standardUri field name
   */
  public static readonly COLUMN_STANDARD_URI: string = 'md_standard_uri';

  /**
   * mimeType field name
   */
  public static readonly COLUMN_MIME_TYPE: string = 'mime_type';

  /**
   * metadata field name
   */
  public static readonly COLUMN_METADATA: string = 'metadata';

  /**
   * Metadata primary key
   * @member {Number}
   */
  id: number;
  /**
   * Case sensitive name of the data scope to which this metadata applies; see Metadata Scopes below
   * @member {string}
   */
  md_scope: string;
  /**
   * URI reference to the metadata structure definition authority
   * @member {string}
   */
  md_standard_uri: string;
  /**
   * MIME encoding of metadata
   * @member {string}
   */
  mime_type: string;
  /**
   * metadata
   * @member {string}
   */
  metadata: string;

  /**
   * Default Constructor
   */
  public constructor();
  /**
   * Copy Constructor
   * @param meta
   */
  public constructor(meta: Metadata);

  /**
   * Constructor
   *
   * @param args
   */
  public constructor(...args) {
    if (args.length === 1 && args[0] instanceof Metadata) {
      this.id = args[0].id;
      this.md_scope = args[0].md_scope;
      this.md_standard_uri = args[0].md_standard_uri;
      this.mime_type = args[0].mime_type;
      this.metadata = args[0].metadata;
    }
  }

  /**
   * Get the id
   *
   * @return id
   */
  public getId(): number {
    return this.id;
  }

  /**
   * Set the id
   *
   * @param id
   *            id
   */
  public setId(id: number): void {
    this.id = id;
  }

  /**
   * Get the metadata scope
   *
   * @return metadata scope type
   */
  public getMetadataScopeType(): MetadataScopeType {
    return MetadataScopeType.fromName(this.md_scope);
  }

  /**
   * Set the metadata scope
   *
   * @param metadataScope
   *            metadata scope type
   */
  public setMetadataScopeType(metadataScope: MetadataScopeType): void {
    this.md_scope = MetadataScopeType.getName(metadataScope);
  }

  /**
   * Get the metadata scope name
   *
   * @return metadata scope name
   * @since 4.0.0
   */
  public getMetadataScopeName(): string {
    return this.md_scope;
  }

  /**
   * Set the metadata scope
   *
   * @param metadataScope
   *            metadata scope name
   * @since 4.0.0
   */
  public setMetadataScope(metadataScope: string): void {
    this.md_scope = metadataScope;
  }

  /**
   * Get the standard URI
   *
   * @return standard URI
   */
  public getStandardUri(): string {
    return this.md_standard_uri;
  }

  /**
   * Set the standard URI
   *
   * @param standardUri
   *            standard URI
   */
  public setStandardUri(standardUri: string): void {
    this.md_standard_uri = standardUri;
  }

  /**
   * Get the MIME type
   *
   * @return MIME type
   */
  public getMimeType(): string {
    return this.mime_type;
  }

  /**
   * Set the MIME type
   *
   * @param mimeType
   *            MIME type
   */
  public setMimeType(mimeType: string): void {
    this.mime_type = mimeType;
  }

  /**
   * Get the metadata
   *
   * @return metadata
   */
  public getMetadata(): string {
    return this.metadata;
  }

  /**
   * Set the metadata
   *
   * @param metadata
   *            metadata
   */
  public setMetadata(metadata: string): void {
    this.metadata = metadata;
  }
}
