import {
  FiniteFilterType,
  Geometry,
  GeometryEnvelope,
  GeometryFilter,
  PointFiniteFilter,
} from '@ngageoint/simple-features-js';
import { ByteOrder, ByteReader, ByteWriter, GeometryReader, GeometryWriter } from '@ngageoint/simple-features-wkb-js';
import {
  GeometryReader as WKTGeometryReader,
  GeometryWriter as WKTGeometryWriter,
  StringReader,
} from '@ngageoint/simple-features-wkt-js';
import { GeoPackageException } from '../geoPackageException';
import { GeoPackageConstants } from '../geoPackageConstants';
import { BoundingBox } from '../boundingBox';
import { GeometryExtensions } from '../extension/geometryExtensions';
import { ProjectionTransform } from '@ngageoint/projections-js';
import { GeometryTransform } from '@ngageoint/simple-features-proj-js';

/**
 * GeoPackage Geometry Data
 */
export class GeoPackageGeometryData {
  /**
   * Point filter
   */
  private static geometryFilter: GeometryFilter = new PointFiniteFilter(FiniteFilterType.FINITE, false, false);

  /**
   * Default SRS Id, Undefined Cartesian (-1)
   */
  private static defaultSrsId = -1;

  /**
   * Default byte order
   */
  private static defaultByteOrder: ByteOrder = ByteOrder.BIG_ENDIAN;

  /**
   * Bytes
   */
  private buffer: Buffer;

  /**
   * Geometry header buffer
   */
  private headerBuffer: Buffer;

  /**
   * Geometry well-known buffer
   */
  private geometryBuffer: Buffer;

  /**
   * True if an extended geometry, false if standard
   */
  private extended = false;

  /**
   * True if the geometry is empty
   */
  private empty = true;

  /**
   * Byte ordering, big or little endian
   */
  private byteOrder: ByteOrder = GeoPackageGeometryData.defaultByteOrder;

  /**
   * Spatial Reference System Id
   */
  private srsId: number;

  /**
   * Envelope
   */
  private envelope: GeometryEnvelope;

  /**
   * Well-Known Binary Geometry index of where the buffer start
   */
  private wkbGeometryIndex = -1;

  /**
   * Geometry
   */
  private geometry: Geometry;

  /**
   * Get geometry filter
   *
   * @return geometry filter
   */
  public static getGeometryFilter(): GeometryFilter {
    return GeoPackageGeometryData.geometryFilter;
  }

  /**
   * Set the geometry filter
   * @param geometryFilter geometry filter
   */
  public static setGeometryFilter(geometryFilter: GeometryFilter): void {
    GeoPackageGeometryData.geometryFilter = geometryFilter;
  }

  /**
   * Get the default SRS id
   * @return SRS id
   */
  public static getDefaultSrsId(): number {
    return GeoPackageGeometryData.defaultSrsId;
  }

  /**
   * Set the default SRS id
   *
   * @param defaultSrsId
   *            SRS id
   */
  public static setDefaultSrsId(defaultSrsId: number): void {
    GeoPackageGeometryData.defaultSrsId = defaultSrsId;
  }

  /**
   * Get the default byte order
   *
   * @return byte order
   */
  public static getDefaultByteOrder(): ByteOrder {
    return GeoPackageGeometryData.defaultByteOrder;
  }

  /**
   * Set the default byte order
   *
   * @param defaultByteOrder
   *            byte order
   */
  public static setDefaultByteOrder(defaultByteOrder: ByteOrder): void {
    GeoPackageGeometryData.defaultByteOrder = defaultByteOrder;
  }

  /**
   * Create geometry data, default SRS Id of {@link #getDefaultSrsId}
   *
   * @param geometry
   *            geometry
   * @return geometry data
   */
  public static create(geometry: Geometry): GeoPackageGeometryData {
    return new GeoPackageGeometryData(geometry);
  }

  /**
   * Create geometry data and build the envelope, default SRS Id of
   * {@link #getDefaultSrsId}
   *
   * @param geometry
   *            geometry
   * @return geometry data
   */
  public static createAndBuildEnvelope(geometry: Geometry): GeoPackageGeometryData {
    return new GeoPackageGeometryData(geometry, true);
  }

  /**
   * Create geometry data
   *
   * @param srsId
   *            SRS id
   * @param geometry
   *            geometry
   * @return geometry data
   */
  public static createWithSrsId(
    srsId: number = GeoPackageGeometryData.defaultSrsId,
    geometry: Geometry,
  ): GeoPackageGeometryData {
    return new GeoPackageGeometryData(srsId, geometry);
  }

  /**
   * Create geometry data and build the envelope
   *
   * @param srsId
   *            SRS id
   * @param geometry
   *            geometry
   * @return geometry data
   */
  public static createAndBuildEnvelopeWithSrsId(srsId: number, geometry: Geometry): GeoPackageGeometryData {
    return new GeoPackageGeometryData(srsId, geometry, true);
  }

  /**
   * Create geometry data and write the GeoPackage geometry buffer, default SRS
   * Id of {@link #getDefaultSrsId()}
   *
   * @param geometry
   *            geometry
   * @return geometry data
   */
  public static createAndWrite(geometry: Geometry): GeoPackageGeometryData {
    return GeoPackageGeometryData.writeBuffer(GeoPackageGeometryData.create(geometry));
  }

  /**
   * Create geometry data, build the envelope, and write the GeoPackage
   * geometry buffer, default SRS Id of {@link #getDefaultSrsId()}
   *
   * @param geometry
   *            geometry
   * @return geometry data
   */
  public static createBuildEnvelopeAndWrite(geometry: Geometry): GeoPackageGeometryData {
    return GeoPackageGeometryData.writeBuffer(GeoPackageGeometryData.createAndBuildEnvelope(geometry));
  }

  /**
   * Create geometry data and write the GeoPackage geometry buffer
   *
   * @param srsId
   *            SRS id
   * @param geometry
   *            geometry
   * @return geometry data
   */
  public static createAndWriteWithSrsId(srsId: number, geometry: Geometry): GeoPackageGeometryData {
    return GeoPackageGeometryData.writeBuffer(GeoPackageGeometryData.createWithSrsId(srsId, geometry));
  }

  /**
   * Create geometry data, build the envelope, and write the GeoPackage
   * geometry buffer
   *
   * @param srsId
   *            SRS id
   * @param geometry
   *            geometry
   * @return geometry data
   */
  public static createBuildEnvelopeAndWriteWithSrsId(srsId: number, geometry: Geometry): GeoPackageGeometryData {
    return GeoPackageGeometryData.writeBuffer(GeoPackageGeometryData.createAndBuildEnvelopeWithSrsId(srsId, geometry));
  }

  /**
   * Create the geometry data from GeoPackage geometry buffer
   *
   * @param buffer
   *            GeoPackage geometry buffer
   * @return geometry data
   */
  public static createWithBuffer(buffer: Buffer): GeoPackageGeometryData {
    return new GeoPackageGeometryData(buffer);
  }

  /**
   * Create the geometry data, default SRS Id of {@link #getDefaultSrsId()}
   *
   * @param geometry
   *            geometry
   * @param envelope
   *            geometry envelope
   * @return geometry data
   */
  public static createWithEnvelope(geometry: Geometry, envelope: GeometryEnvelope): GeoPackageGeometryData {
    return new GeoPackageGeometryData(geometry, envelope);
  }

  /**
   * Create the geometry data
   *
   * @param srsId
   *            SRS id
   * @param geometry
   *            geometry
   * @param envelope
   *            geometry envelope
   * @return geometry data
   */
  public static createWithSrsIdAndEnvelope(
    srsId: number,
    geometry: Geometry,
    envelope: GeometryEnvelope,
  ): GeoPackageGeometryData {
    return new GeoPackageGeometryData(srsId, geometry, envelope);
  }

  /**
   * Copy the geometry data and create
   *
   * @param geometryData
   *            geometry data
   * @return geometry data
   */
  public static createFromGeometryData(geometryData: GeoPackageGeometryData): GeoPackageGeometryData {
    return new GeoPackageGeometryData(geometryData);
  }

  /**
   * Create the geometry data from Well-Known Bytes, default SRS Id of
   * {@link #getDefaultSrsId}
   *
   * @param buffer
   *            well-known buffer
   * @return geometry data
   */
  public static createFromWkb(buffer: Buffer): GeoPackageGeometryData {
    return GeoPackageGeometryData.createFromWkbWithSrsId(GeoPackageGeometryData.defaultSrsId, buffer);
  }

  /**
   * Create the geometry data from Well-Known Bytes and build the envelope,
   * default SRS Id of {@link #getDefaultSrsId}
   *
   * @param buffer
   *            well-known buffer
   * @return geometry data
   */
  public static createFromWkbAndBuildEnvelope(buffer: Buffer): GeoPackageGeometryData {
    return GeoPackageGeometryData.createFromWkbAndBuildEnvelopeWithSrsId(GeoPackageGeometryData.defaultSrsId, buffer);
  }

  /**
   * Create the geometry data from Well-Known Bytes
   *
   * @param srsId
   *            SRS id
   * @param buffer
   *            well-known buffer
   * @return geometry data
   */
  public static createFromWkbWithSrsId(srsId: number, buffer: Buffer): GeoPackageGeometryData {
    return GeoPackageGeometryData.createWithSrsId(srsId, GeoPackageGeometryData.createGeometryFromWkb(buffer));
  }

  /**
   * Create the geometry data from Well-Known Bytes and build the envelope
   *
   * @param srsId
   *            SRS id
   * @param buffer
   *            well-known buffer
   * @return geometry data
   */
  public static createFromWkbAndBuildEnvelopeWithSrsId(srsId: number, buffer: Buffer): GeoPackageGeometryData {
    return GeoPackageGeometryData.createAndBuildEnvelopeWithSrsId(
      srsId,
      GeoPackageGeometryData.createGeometryFromWkb(buffer),
    );
  }

  /**
   * Create the geometry data from Well-Known Bytes and write the GeoPackage
   * geometry buffer, default SRS Id of {@link #getDefaultSrsId}
   *
   * @param buffer
   *            well-known buffer
   * @return geometry data
   */
  public static createFromWkbAndWrite(buffer: Buffer): GeoPackageGeometryData {
    return GeoPackageGeometryData.writeBuffer(GeoPackageGeometryData.createFromWkb(buffer));
  }

  /**
   * Create the geometry data from Well-Known Bytes, build the envelope, and
   * write the GeoPackage geometry buffer, default SRS Id of
   * {@link #getDefaultSrsId}
   *
   * @param buffer
   *            well-known buffer
   * @return geometry data
   */
  public static createFromWkbBuildEnvelopeAndWrite(buffer: Buffer): GeoPackageGeometryData {
    return GeoPackageGeometryData.writeBuffer(GeoPackageGeometryData.createFromWkbAndBuildEnvelope(buffer));
  }

  /**
   * Create the geometry data from Well-Known Bytes and write the GeoPackage
   * geometry buffer
   *
   * @param srsId
   *            SRS id
   * @param buffer
   *            well-known buffer
   * @return geometry data
   */
  public static createFromWkbAndWriteWithSrsId(srsId: number, buffer: Buffer): GeoPackageGeometryData {
    return GeoPackageGeometryData.writeBuffer(GeoPackageGeometryData.createFromWkbWithSrsId(srsId, buffer));
  }

  /**
   * Create the geometry data from Well-Known Bytes, build the envelope, and
   * write the GeoPackage geometry buffer
   *
   * @param srsId
   *            SRS id
   * @param buffer
   *            well-known buffer
   * @return geometry data
   */
  public static createFromWkbBuildEnvelopeAndWriteWithSrsId(srsId: number, buffer: Buffer): GeoPackageGeometryData {
    return GeoPackageGeometryData.writeBuffer(
      GeoPackageGeometryData.createFromWkbAndBuildEnvelopeWithSrsId(srsId, buffer),
    );
  }

  /**
   * Create a geometry from Well-Known Bytes
   *
   * @param buffer
   *            well-known buffer
   * @return geometry
   */
  public static createGeometryFromWkb(buffer: Buffer): Geometry {
    return GeometryReader.readGeometry(buffer, GeoPackageGeometryData.geometryFilter);
  }

  /**
   * Create the geometry data from Well-Known Text, default SRS Id of
   * {@link #getDefaultSrsId}
   *
   * @param text
   *            well-known text
   * @return geometry data
   */
  public static createFromWkt(text: string): GeoPackageGeometryData {
    return GeoPackageGeometryData.createFromWktWithSrsId(GeoPackageGeometryData.defaultSrsId, text);
  }

  /**
   * Create the geometry data from Well-Known Text and build the envelope,
   * default SRS Id of {@link #getDefaultSrsId}
   *
   * @param text
   *            well-known text
   * @return geometry data
   */
  public static createFromWktAndBuildEnvelope(text: string): GeoPackageGeometryData {
    return GeoPackageGeometryData.createFromWktAndBuildEnvelopeWithSrsId(GeoPackageGeometryData.defaultSrsId, text);
  }

  /**
   * Create the geometry data from Well-Known Text
   *
   * @param srsId
   *            SRS id
   * @param text
   *            well-known text
   * @return geometry data
   */
  public static createFromWktWithSrsId(srsId: number, text: string): GeoPackageGeometryData {
    return GeoPackageGeometryData.createWithSrsId(srsId, GeoPackageGeometryData.createGeometryFromWkt(text));
  }

  /**
   * Create the geometry data from Well-Known Text and build the envelope
   *
   * @param srsId
   *            SRS id
   * @param text
   *            well-known text
   * @return geometry data
   */
  public static createFromWktAndBuildEnvelopeWithSrsId(srsId: number, text: string): GeoPackageGeometryData {
    return GeoPackageGeometryData.createAndBuildEnvelopeWithSrsId(
      srsId,
      GeoPackageGeometryData.createGeometryFromWkt(text),
    );
  }

  /**
   * Create the geometry data from Well-Known Text and write the GeoPackage
   * geometry buffer, default SRS Id of {@link #getDefaultSrsId}
   *
   * @param text
   *            well-known text
   * @return geometry data
   */
  public static createFromWktAndWrite(text: string): GeoPackageGeometryData {
    return GeoPackageGeometryData.writeBuffer(GeoPackageGeometryData.createFromWkt(text));
  }

  /**
   * Create the geometry data from Well-Known Text, build the envelope, and
   * write the GeoPackage geometry buffer, default SRS Id of
   * {@link #getDefaultSrsId}
   *
   * @param text
   *            well-known text
   * @return geometry data
   */
  public static createFromWktBuildEnvelopeAndWrite(text: string): GeoPackageGeometryData {
    return GeoPackageGeometryData.writeBuffer(GeoPackageGeometryData.createFromWktAndBuildEnvelope(text));
  }

  /**
   * Create the geometry data from Well-Known Text and write the GeoPackage
   * geometry buffer
   *
   * @param srsId
   *            SRS id
   * @param text
   *            well-known text
   * @return geometry data
   */
  public static createFromWktAndWriteWithSrsId(srsId: number, text: string): GeoPackageGeometryData {
    return GeoPackageGeometryData.writeBuffer(GeoPackageGeometryData.createFromWktWithSrsId(srsId, text));
  }

  /**
   * Create the geometry data from Well-Known Text, build the envelope, and
   * write the GeoPackage geometry buffer
   *
   * @param srsId
   *            SRS id
   * @param text
   *            well-known text
   * @return geometry data
   */
  public static createFromWktBuildEnvelopeAndWriteWithSrsId(srsId: number, text: string): GeoPackageGeometryData {
    return GeoPackageGeometryData.writeBuffer(
      GeoPackageGeometryData.createFromWktAndBuildEnvelopeWithSrsId(srsId, text),
    );
  }

  /**
   * Create a geometry from Well-Known Text
   *
   * @param text
   *            well-known text
   * @return geometry
   */
  public static createGeometryFromWkt(text: string): Geometry {
    return WKTGeometryReader.readGeometry(new StringReader(text), GeoPackageGeometryData.geometryFilter);
  }

  /**
   * GeoPackage geometry buffer from the geometry, default SRS Id of
   * {@link #getDefaultSrsId()}
   *
   * @param geometry
   *            geometry
   * @return GeoPackage geometry buffer
   */
  public static buffer(geometry: Geometry): Buffer {
    return GeoPackageGeometryData.createAndWrite(geometry).getBuffer();
  }

  /**
   * GeoPackage geometry buffer from the geometry with built envelope, default
   * SRS Id of {@link #getDefaultSrsId()}
   *
   * @param geometry
   *            geometry
   * @return GeoPackage geometry buffer
   */
  public static bufferAndBuildEnvelope(geometry: Geometry): Buffer {
    return GeoPackageGeometryData.createBuildEnvelopeAndWrite(geometry).getBuffer();
  }

  /**
   * GeoPackage geometry buffer from the geometry
   *
   * @param srsId
   *            SRS id
   * @param geometry
   *            geometry
   * @return GeoPackage geometry buffer
   */
  public static bufferWithSrsIdWithSrsId(srsId: number, geometry: Geometry): Buffer {
    return GeoPackageGeometryData.createAndWriteWithSrsId(srsId, geometry).getBuffer();
  }

  /**
   * GeoPackage geometry buffer from the geometry with built envelope
   *
   * @param srsId
   *            SRS id
   * @param geometry
   *            geometry
   * @return GeoPackage geometry buffer
   */
  public static bufferAndBuildEnvelopeWithSrsId(srsId: number, geometry: Geometry): Buffer {
    return GeoPackageGeometryData.createBuildEnvelopeAndWriteWithSrsId(srsId, geometry).getBuffer();
  }

  /**
   * GeoPackage geometry buffer from Well-Known buffer, default SRS Id of
   * {@link #getDefaultSrsId}
   *
   * @param buffer
   *            well-known buffer
   * @return GeoPackage geometry buffer
   */
  public static bufferFromWkb(buffer: Buffer): Buffer {
    return GeoPackageGeometryData.createFromWkbAndWrite(buffer).getBuffer();
  }

  /**
   * GeoPackage geometry buffer from Well-Known buffer with built envelope,
   * default SRS Id of {@link #getDefaultSrsId}
   *
   * @param buffer
   *            well-known buffer
   * @return GeoPackage geometry buffer
   */
  public static bufferFromWkbAndBuildEnvelope(buffer: Buffer): Buffer {
    return GeoPackageGeometryData.createFromWkbBuildEnvelopeAndWrite(buffer).getBuffer();
  }

  /**
   * GeoPackage geometry buffer from Well-Known buffer
   *
   * @param srsId
   *            SRS id
   * @param buffer
   *            well-known buffer
   * @return GeoPackage geometry buffer
   */
  public static bufferFromWkbWithSrsId(srsId: number, buffer: Buffer): Buffer {
    return GeoPackageGeometryData.createFromWkbAndWriteWithSrsId(srsId, buffer).getBuffer();
  }

  /**
   * GeoPackage geometry buffer from Well-Known buffer with built envelope
   *
   * @param srsId
   *            SRS id
   * @param buffer
   *            well-known buffer
   * @return GeoPackage geometry buffer
   */
  public static bufferFromWkbAndBuildEnvelopeWithSrsId(srsId: number, buffer: Buffer): Buffer {
    return GeoPackageGeometryData.createFromWkbBuildEnvelopeAndWriteWithSrsId(srsId, buffer).getBuffer();
  }

  /**
   * GeoPackage geometry buffer from Well-Known text, default SRS Id of
   * {@link #getDefaultSrsId}
   *
   * @param text
   *            well-known text
   * @return GeoPackage geometry buffer
   */
  public static bufferFromWkt(text: string): Buffer {
    return GeoPackageGeometryData.createFromWktAndWrite(text).getBuffer();
  }

  /**
   * GeoPackage geometry buffer from Well-Known text with built envelope,
   * default SRS Id of {@link #getDefaultSrsId}
   *
   * @param text
   *            well-known text
   * @return GeoPackage geometry buffer
   */
  public static bufferFromWktAndBuildEnvelope(text: string): Buffer {
    return GeoPackageGeometryData.createFromWktBuildEnvelopeAndWrite(text).getBuffer();
  }

  /**
   * GeoPackage geometry buffer from Well-Known text
   *
   * @param srsId
   *            SRS id
   * @param text
   *            well-known text
   * @return GeoPackage geometry buffer
   */
  public static bufferFromWktWithSrsId(srsId: number, text: string): Buffer {
    return GeoPackageGeometryData.createFromWktAndWriteWithSrsId(srsId, text).getBuffer();
  }

  /**
   * GeoPackage geometry buffer from Well-Known text with built envelope
   *
   * @param srsId
   *            SRS id
   * @param text
   *            well-known text
   * @return GeoPackage geometry buffer
   */
  public static bufferFromWktAndBuildEnvelopeWithSrsId(srsId: number, text: string): Buffer {
    return GeoPackageGeometryData.createFromWktBuildEnvelopeAndWriteWithSrsId(srsId, text).getBuffer();
  }

  /**
   * Well-Known Bytes from the geometry data
   *
   * @param geometryData
   *            geometry data
   * @return well-known buffer
   */
  public static wkb(geometryData: GeoPackageGeometryData): Buffer {
    return geometryData.getWkb();
  }

  /**
   * Well-Known Bytes from the geometry
   *
   * @param geometry
   *            geometry
   * @return well-known buffer
   */
  public static wkbFromGeometry(geometry: Geometry): Buffer {
    return GeoPackageGeometryData.createAndWrite(geometry).getWkb();
  }

  /**
   * Well-Known Bytes from GeoPackage geometry buffer
   *
   * @param buffer
   *            GeoPackage geometry buffer
   * @return well-known buffer
   */
  public static wkbFromBuffer(buffer: Buffer): Buffer {
    return GeoPackageGeometryData.createWithBuffer(buffer).getWkb();
  }

  /**
   * Well-Known Bytes from Well-Known Text
   *
   * @param text
   *            well-known text
   * @return well-known buffer
   */
  public static wkbFromWkt(text: string): Buffer {
    return GeoPackageGeometryData.createFromWktAndWrite(text).getWkb();
  }

  /**
   * Well-Known Text from the geometry data
   *
   * @param geometryData
   *            geometry data
   * @return well-known text
   */
  public static wkt(geometryData: GeoPackageGeometryData): string {
    return geometryData.getWkt();
  }

  /**
   * Well-Known Text from the geometry
   *
   * @param geometry
   *            geometry
   * @return well-known text
   */
  public static wktFromGeometry(geometry: Geometry): string {
    return GeoPackageGeometryData.create(geometry).getWkt();
  }

  /**
   * Well-Known Text from GeoPackage Geometry Bytes
   *
   * @param buffer
   *            GeoPackage geometry buffer
   * @return well-known text
   */
  public static wktFromBuffer(buffer: Buffer): string {
    return GeoPackageGeometryData.createWithBuffer(buffer).getWkt();
  }

  /**
   * Well-Known Text from Well-Known Bytes
   *
   * @param buffer
   *            well-known buffer
   * @return well-known text
   */
  public static wktFromWkb(buffer: Buffer): string {
    return GeoPackageGeometryData.createFromWkb(buffer).getWkt();
  }

  public constructor();
  public constructor(geometryData: GeoPackageGeometryData);
  public constructor(geometry: Geometry);
  public constructor(buffer: Buffer);
  public constructor(uint8Array: Uint8Array);
  public constructor(srsId: number);
  public constructor(srsId: number, geometry: Geometry);
  public constructor(geometry: Geometry, buildEnvelope: boolean);
  public constructor(geometry: Geometry, envelope: GeometryEnvelope);
  public constructor(srsId: number, geometry: Geometry, buildEnvelope: boolean);
  public constructor(srsId: number, geometry: Geometry, envelope: GeometryEnvelope);

  /**
   * Default Constructor, default SRS Id of {@link #getDefaultSrsId}
   *
   */
  public constructor(...args) {
    if (args.length === 0) {
      this.srsId = GeoPackageGeometryData.defaultSrsId;
    } else if (args.length === 1) {
      if (typeof args[0] === 'number') {
        this.srsId = args[0];
      } else if (args[0] instanceof Uint8Array) {
        this.fromBuffer(Buffer.from(args[0]));
      } else if (args[0] instanceof Geometry) {
        this.setGeometry(args[0]);
      } else if (args[0] instanceof GeoPackageGeometryData) {
        const geometryData: GeoPackageGeometryData = args[0];
        this.srsId = geometryData.srsId;
        let geometry: Geometry = geometryData.geometry;
        if (geometry != null) {
          geometry = geometry.copy();
        }
        this.setGeometry(geometry);
        let envelope: GeometryEnvelope = geometryData.envelope;
        if (envelope != null) {
          envelope = envelope.copy();
        }
        this.envelope = envelope;
        let buffer: Buffer = geometryData.buffer;
        if (buffer != null) {
          buffer = Buffer.from(buffer);
        }
        this.buffer = buffer;
        this.wkbGeometryIndex = geometryData.wkbGeometryIndex;
        this.byteOrder = geometryData.byteOrder;
      } else if (args[0] instanceof Buffer) {
        this.fromBuffer(args[0]);
      }
    } else if (args.length === 2) {
      if (args[0] instanceof Geometry && typeof args[1] === 'boolean') {
        this.setGeometry(args[0]);
        if (args[1]) {
          this.buildEnvelope();
        }
      } else if (args[1] instanceof Geometry && typeof args[0] === 'number') {
        this.srsId = args[0];
        this.setGeometry(args[1]);
      } else if (args[0] instanceof Geometry && args[1] instanceof GeometryEnvelope) {
        this.setGeometry(args[0]);
        this.setEnvelope(args[1]);
      }
    } else if (args.length === 3) {
      if (typeof args[0] === 'number' && args[1] instanceof Geometry && typeof args[2] === 'boolean') {
        this.srsId = args[0];
        this.setGeometry(args[1]);
        if (args[1]) {
          this.buildEnvelope();
        }
      } else if (typeof args[0] === 'number' && args[1] instanceof Geometry && args[2] instanceof GeometryEnvelope) {
        this.srsId = args[0];
        this.setGeometry(args[1]);
        this.setEnvelope(args[2]);
      }
    }
  }

  private readString(num: number, reader: ByteReader): string {
    const parts = [];
    for (let i = 0; i < num; i++) {
      const byte = reader.readByte();
      parts.push(Number.parseInt(byte));
    }
    return String.fromCharCode(...parts);
  }

  private writeString(str: string, writer: ByteWriter): void {
    for (let i = 0; i < str.length; i++) {
      writer.writeUInt8(str.charCodeAt(i));
    }
  }

  /**
   * Populate the geometry data from the buffer
   *
   * @param buffer
   *            geometry buffer
   */
  public fromBuffer(buffer: Buffer): void {
    const reader = new ByteReader(buffer);

    // Get 2 buffer as the magic number and validate
    let magic = '';
    try {
      magic = this.readString(2, reader);
    } catch (e) {
      throw new GeoPackageException(
        'Unexpected GeoPackage Geometry magic number character encoding: Expected: ' +
          GeoPackageConstants.GEOMETRY_MAGIC_NUMBER,
      );
    }
    if (magic !== GeoPackageConstants.GEOMETRY_MAGIC_NUMBER) {
      throw new GeoPackageException(
        'Unexpected GeoPackage Geometry magic number: ' +
          magic +
          ', Expected: ' +
          GeoPackageConstants.GEOMETRY_MAGIC_NUMBER,
      );
    }

    try {
      // Get a byte as the version and validate, value of 0 = version 1
      const version = Number.parseInt(reader.readByte());
      if (version !== GeoPackageConstants.GEOMETRY_VERSION_1) {
        throw new GeoPackageException(
          'Unexpected GeoPackage Geometry version: ' +
            version +
            ', Expected: ' +
            GeoPackageConstants.GEOMETRY_VERSION_1,
        );
      }

      // Get a flags byte and then read the flag values
      const flags = Number.parseInt(reader.readByte());
      const envelopeIndicator = this.readFlags(flags);
      reader.setByteOrder(this.byteOrder);

      // Read the 5th - 8th buffer as the srs id
      this.srsId = reader.readInt();

      // Read the envelope
      this.envelope = this.readEnvelope(envelopeIndicator, reader);
    } catch (e) {
      if (e instanceof GeoPackageException) {
        throw e;
      } else {
        throw new GeoPackageException('Failed to read the GeoPackage geometry header');
      }
    }

    // Save off where the WKB buffer start
    this.wkbGeometryIndex = reader.position;

    // Read the Well-Known Binary Geometry if not marked as empty
    if (!this.empty) {
      try {
        this.geometry = GeometryReader.readGeometryWithByteReader(reader, GeoPackageGeometryData.geometryFilter);
      } catch (e) {
        throw new GeoPackageException('Failed to read the WKB geometry');
      }
    }
  }

  private getBufferSize(): number {
    let size = 0;
    if (this.buffer == null) {
      if (this.headerBuffer != null) {
        size += this.headerBuffer.byteLength;
      } else {
        size += 2; // magic number
        size += 1; // geometry version
        size += 1; // byte flag
        size += 1; // byte order
        size += 4; // srsId
        if (this.envelope != null) {
          size += 8 * 4;
          if (this.envelope.hasZ) {
            size += 8 * 2;
          }
          if (this.envelope.hasM) {
            size += 8 * 2;
          }
        }
      }
      // Write the Well-Known Binary Geometry if not marked as empty
      if (!this.empty) {
        if (this.geometryBuffer != null) {
          size += this.geometryBuffer.byteLength;
        } else if (this.geometry != null) {
          this.geometryBuffer = GeometryWriter.writeGeometry(this.geometry, this.byteOrder);
          size += this.geometryBuffer.byteLength;
        }
      }
    }
    return size;
  }

  /**
   * Write the geometry to buffer
   *
   * @return buffer
   */
  public toBuffer(): Buffer {
    if (this.buffer == null) {
      const writer = new ByteWriter(this.getBufferSize());
      if (this.headerBuffer != null) {
        writer.writeBuffer(this.headerBuffer);
      } else {
        // Write GP as the 2 byte magic number
        this.writeString(GeoPackageConstants.GEOMETRY_MAGIC_NUMBER, writer);

        // Write a byte as the version, value of 0 = version 1
        writer.writeUInt8(GeoPackageConstants.GEOMETRY_VERSION_1);

        // Build and write a flags byte
        const flags = this.buildFlagsByte();
        writer.writeUInt8(flags);
        writer.setByteOrder(this.byteOrder);

        // Write the 4 byte srs id int
        writer.writeInt(this.srsId);

        // Write the envelope
        this.writeEnvelope(writer);
      }

      // Save off where the WKB buffer start
      this.wkbGeometryIndex = writer.position;

      // Write the Well-Known Binary Geometry if not marked as empty
      if (!this.empty) {
        if (this.geometryBuffer != null) {
          writer.writeBuffer(this.geometryBuffer);
        } else if (this.geometry != null) {
          this.geometryBuffer = GeometryWriter.writeGeometry(this.geometry, this.byteOrder);
          writer.writeBuffer(this.geometryBuffer);
        }
      }
      // Get the buffer
      this.buffer = writer.getBuffer();
    }

    return this.buffer;
  }

  /**
   * Read the flags from the flag byte and return the envelope indicator
   * @param flags flags byte
   * @return envelope indicator
   */
  private readFlags(flags: number): number {
    // Verify the reserved bits at 7 and 6 are 0
    const reserved7 = (flags >> 7) & 1;
    const reserved6 = (flags >> 6) & 1;
    if (reserved7 != 0 || reserved6 != 0) {
      throw new GeoPackageException(
        'Unexpected GeoPackage Geometry flags. Flag bit 7 and 6 should both be 0, 7=' + reserved7 + ', 6=' + reserved6,
      );
    }

    // Get the binary type from bit 5, 0 for standard and 1 for extended
    const binaryType = (flags >> 5) & 1;
    this.extended = binaryType == 1;

    // Get the empty geometry flag from bit 4, 0 for non-empty and 1 for
    // empty
    const emptyValue = (flags >> 4) & 1;
    this.empty = emptyValue == 1;

    // Get the envelope contents indicator code (3-bit unsigned integer from
    // bits 3, 2, and 1)
    const envelopeIndicator = (flags >> 1) & 7;
    if (envelopeIndicator > 4) {
      throw new GeoPackageException(
        'Unexpected GeoPackage Geometry flags. Envelope contents indicator must be between 0 and 4. Actual: ' +
          envelopeIndicator,
      );
    }

    // Get the byte order from bit 0, 0 for Big Endian and 1 for Little
    // Endian
    const byteOrderValue = flags & 1;
    this.byteOrder = byteOrderValue == 0 ? ByteOrder.BIG_ENDIAN : ByteOrder.LITTLE_ENDIAN;

    return envelopeIndicator;
  }

  /**
   * Build the flags byte from the flag values
   *
   * @return envelope indicator
   */
  private buildFlagsByte(): number {
    let flag = 0;

    // Add the binary type to bit 5, 0 for standard and 1 for extended
    const binaryType = this.extended ? 1 : 0;
    flag += binaryType << 5;

    // Add the empty geometry flag to bit 4, 0 for non-empty and 1 for
    // empty
    const emptyValue = this.empty ? 1 : 0;
    flag += emptyValue << 4;

    // Add the envelope contents indicator code (3-bit unsigned integer to bits 3, 2, and 1)
    const envelopeIndicator = this.envelope == null ? 0 : GeoPackageGeometryData.getIndicator(this.envelope);
    flag += envelopeIndicator << 1;

    // Add the byte order to bit 0, 0 for Big Endian and 1 for Little Endian
    const byteOrderValue = this.byteOrder == ByteOrder.BIG_ENDIAN ? 0 : 1;
    flag += byteOrderValue;

    return flag;
  }

  /**
   * Read the envelope based upon the indicator value
   *
   * @param envelopeIndicator  envelope indicator
   * @param reader  byte reader
   * @return geometry envelope
   */
  private readEnvelope(envelopeIndicator: number, reader: ByteReader): GeometryEnvelope {
    let envelope: GeometryEnvelope = null;

    if (envelopeIndicator > 0) {
      // Read x and y values and create envelope
      const minX = reader.readDouble();
      const maxX = reader.readDouble();
      const minY = reader.readDouble();
      const maxY = reader.readDouble();

      let hasZ = false;
      let minZ = null;
      let maxZ = null;

      let hasM = false;
      let minM = null;
      let maxM = null;

      // Read z values
      if (envelopeIndicator === 2 || envelopeIndicator === 4) {
        hasZ = true;
        minZ = reader.readDouble();
        maxZ = reader.readDouble();
      }

      // Read m values
      if (envelopeIndicator === 3 || envelopeIndicator === 4) {
        hasM = true;
        minM = reader.readDouble();
        maxM = reader.readDouble();
      }

      envelope = new GeometryEnvelope(hasZ, hasM);

      envelope.minX = minX;
      envelope.maxX = maxX;
      envelope.minY = minY;
      envelope.maxY = maxY;

      if (hasZ) {
        envelope.minZ = minZ;
        envelope.maxZ = maxZ;
      }

      if (hasM) {
        envelope.minM = minM;
        envelope.maxM = maxM;
      }
    }

    return envelope;
  }

  /**
   * Write the envelope buffer
   *
   * @param writer
   *            byte writer
   */
  private writeEnvelope(writer: ByteWriter): void {
    if (this.envelope != null) {
      // Write x and y values
      writer.writeDouble(this.envelope.minX);
      writer.writeDouble(this.envelope.maxX);
      writer.writeDouble(this.envelope.minY);
      writer.writeDouble(this.envelope.maxY);

      // Write z values
      if (this.envelope.hasZ) {
        writer.writeDouble(this.envelope.minZ);
        writer.writeDouble(this.envelope.maxZ);
      }

      // Write m values
      if (this.envelope.hasM) {
        writer.writeDouble(this.envelope.minM);
        writer.writeDouble(this.envelope.maxM);
      }
    }
  }

  /**
   * Is the geometry extended
   *
   * @return true if extended
   */
  public isExtended(): boolean {
    return this.extended;
  }

  /**
   * Is the geometry empty
   *
   * @return true if empty
   */
  public isEmpty(): boolean {
    return this.empty;
  }

  /**
   * Get the byte order
   *
   * @return byte order
   */
  public getByteOrder(): ByteOrder {
    return this.byteOrder;
  }

  /**
   * Get the SRS id
   *
   * @return SRS id
   */
  public getSrsId(): number {
    return this.srsId;
  }

  /**
   * Get the geometry envelope
   *
   * @return geometry envelope
   */
  public getEnvelope(): GeometryEnvelope {
    return this.envelope;
  }

  /**
   * Get the bounding box of the geometry envelope
   *
   * @return bounding box
   */
  public getBoundingBox(): BoundingBox {
    let boundingBox = null;
    if (this.envelope != null) {
      boundingBox = new BoundingBox(this.envelope);
    }
    return boundingBox;
  }

  /**
   * Get the geometry
   *
   * @return geometry
   */
  public getGeometry(): Geometry {
    return this.geometry;
  }

  /**
   * Get the geometry or read it from geometry buffer
   *
   * @return geometry
   */
  public getOrReadGeometry(): Geometry {
    if (this.geometry == null && this.geometryBuffer != null) {
      this.geometry = GeometryReader.readGeometry(this.geometryBuffer, GeoPackageGeometryData.geometryFilter);
    }
    return this.geometry;
  }

  /**
   * Set the extended flag
   *
   * @param extended
   *            extended value
   */
  public setExtended(extended: boolean): void {
    if (this.extended !== extended) {
      this.setHeaderBuffer();
      this.extended = extended;
    }
  }

  /**
   * Set the empty flag
   *
   * @param empty
   *            empty value
   */
  public setEmpty(empty: boolean): void {
    if (this.empty !== empty) {
      this.setHeaderBuffer();
      this.empty = empty;
    }
  }

  /**
   * Set the byte order
   *
   * @param byteOrder
   *            byte order
   */
  public setByteOrder(byteOrder: ByteOrder): void {
    if (byteOrder == null) {
      byteOrder = GeoPackageGeometryData.defaultByteOrder;
    }
    if (this.byteOrder !== byteOrder) {
      this.setHeaderBuffer();
      this.byteOrder = byteOrder;
    }
  }

  /**
   * Set the SRS id
   *
   * @param srsId
   *            SRS id
   */
  public setSrsId(srsId: number): void {
    if (this.srsId !== srsId) {
      this.setHeaderBuffer();
      this.srsId = srsId;
    }
  }

  /**
   * Set the geometry envelope
   *
   * @param envelope
   *            geometry envelope
   */
  public setEnvelope(envelope: GeometryEnvelope): void {
    if (envelope != null ? !envelope.equals(this.envelope) : this.envelope != null) {
      this.setHeaderBuffer();
      this.envelope = envelope;
    }
  }

  /**
   * Set the buffer
   *
   * @param buffer
   *            buffer
   * @param wkbGeometryIndex
   *            well-known geometry buffer start index
   */
  public setBuffer(buffer: Buffer, wkbGeometryIndex = -1): void {
    this.setHeaderBuffer();
    this.clearGeometryBuffer();
    this.buffer = buffer;
    this.wkbGeometryIndex = wkbGeometryIndex;
  }

  /**
   * Set the geometry header buffer
   *
   * @param buffer header buffer
   */
  public setHeaderBuffer(buffer: Buffer = null): void {
    this.clearBuffer();
    this.headerBuffer = buffer;
  }

  /**
   * Set the geometry. Updates the empty flag. Updates the extended flag if
   * the geometry is not null. Following invoking this method and upon setting
   * the SRS id, call {@link #toBytes()} to convert the geometry to buffer.
   * Alternatively call {@link #setGeometryToBytes(Geometry)} or
   * {@link #setGeometryAndBuildEnvelopeToBytes(Geometry)} to perform both
   * operations.
   *
   * @param geometry
   *            geometry
   */
  public setGeometry(geometry: Geometry): void {
    this.clearGeometryBuffer();
    this.geometry = geometry;
    this.empty = geometry == null;
    if (geometry != null) {
      this.extended = GeometryExtensions.isNonStandard(geometry.geometryType);
    }
  }

  /**
   * Set the geometry buffer. Updates the empty flag. Extended flag should be
   * manually set with {@link #setExtended(boolean)} as needed.
   *
   * @param buffer
   *            geometry buffer
   */
  public setGeometryBytes(buffer: Buffer): void {
    this.clearBuffer();
    this.geometry = null;
    this.geometryBuffer = buffer;
    this.empty = buffer == null;
  }

  /**
   * Set the geometry, build the envelope, and write to buffer
   *
   * @param geometry
   *            geometry
   * @return geometry buffer
   */
  public setGeometryAndBuildEnvelopeToBytes(geometry: Geometry): Buffer {
    return this.setGeometryToBuffer(geometry, true);
  }

  /**
   * Set the geometry, optionally build the envelope, and write to buffer
   *
   * @param geometry
   *            geometry
   * @param buildEnvelope
   *            true to build and set the envelope
   * @return geometry buffer
   */
  private setGeometryToBuffer(geometry: Geometry, buildEnvelope = false): Buffer {
    this.setGeometry(geometry);
    if (buildEnvelope) {
      this.buildEnvelope();
    }
    return this.toBuffer();
  }

  /**
   * Set the geometry from Well-Known buffer
   *
   * @param buffer
   *            well-known buffer
   */
  public setGeometryFromWkb(buffer: Buffer): void {
    this.setGeometry(GeoPackageGeometryData.createGeometryFromWkb(buffer));
  }

  /**
   * Set the geometry from Well-Known text
   *
   * @param text  well-known text
   */
  public setGeometryFromWkt(text: string): void {
    this.setGeometry(GeoPackageGeometryData.createGeometryFromWkt(text));
  }

  /**
   * Clear the buffer
   *
   */
  public clearBuffer(): void {
    this.buffer = null;
    this.wkbGeometryIndex = -1;
  }

  /**
   * Clear the geometry buffer and overall buffer
   *
   */
  public clearGeometryBuffer(): void {
    this.clearBuffer();
    this.geometryBuffer = null;
  }

  /**
   * Get the buffer of the entire GeoPackage geometry including GeoPackage
   * header and WKB buffer
   *
   * @return buffer
   */
  public getBuffer(): Buffer {
    return this.toBuffer();
  }

  /**
   * Get the GeoPackage header buffer
   *
   * @return header buffer
   */
  public getHeaderBuffer(): Buffer {
    if (this.headerBuffer == null && this.toBuffer() != null) {
      this.headerBuffer = Buffer.from(this.buffer).slice(0, this.wkbGeometryIndex);
    }
    return this.headerBuffer;
  }

  /**
   * Get the Well-Known Binary Geometry buffer
   *
   * @return buffer
   */
  public getWkb(): Buffer {
    if (this.geometryBuffer == null && this.toBuffer() != null) {
      this.geometryBuffer = Buffer.from(this.buffer).slice(this.wkbGeometryIndex);
    }
    return this.geometryBuffer;
  }

  /**
   * Return the byte index where the Well-Known Binary buffer start
   *
   * @return index
   */
  public getWkbGeometryIndex(): number {
    return this.wkbGeometryIndex;
  }

  /**
   * Get a Well-Known text string from the geometry
   *
   * @return well-known text string
   */
  public getWkt(): string {
    let wkt = null;
    try {
      const geometry: Geometry = this.getOrReadGeometry();
      if (geometry != null) {
        wkt = WKTGeometryWriter.writeGeometry(geometry);
      }
    } catch (e) {
      throw new GeoPackageException('Failed to write the geometry WKT');
    }
    return wkt;
  }

  /**
   * Get the envelope if it exists or build, set, and retrieve it from the
   * geometry
   *
   * @return geometry envelope
   */
  public getOrBuildEnvelope(): GeometryEnvelope {
    let envelope: GeometryEnvelope = this.getEnvelope();
    if (envelope == null) {
      envelope = this.buildEnvelope();
    }
    return envelope;
  }

  /**
   * Build, set, and retrieve the envelope from the geometry
   *
   * @return geometry envelope
   */
  public buildEnvelope(): GeometryEnvelope {
    let envelope: GeometryEnvelope = null;
    const geometry: Geometry = this.getOrReadGeometry();
    if (geometry != null) {
      envelope = geometry.getEnvelope();
    }
    this.setEnvelope(envelope);
    return envelope;
  }

  /**
   * Get the bounding box of the geometry envelope if it exists or build, set
   * and retrieve it from the geometry
   *
   * @return bounding box
   */
  public getOrBuildBoundingBox(): BoundingBox {
    let boundingBox = null;
    const envelope: GeometryEnvelope = this.getOrBuildEnvelope();
    if (envelope != null) {
      boundingBox = new BoundingBox(envelope);
    }
    return boundingBox;
  }

  /**
   * Get the envelope flag indicator
   * 1 for xy, 2 for xyz, 3 for xym, 4 for xyzm (null would be 0)
   * @param {GeometryEnvelope} envelope geometry envelope
   * @return {number} indicator
   */
  public static getIndicator(envelope: GeometryEnvelope): number {
    let indicator = 1;
    if (envelope.hasZ) {
      indicator++;
    }
    if (envelope.hasM) {
      indicator += 2;
    }
    return indicator;
  }

  /**
   * Transform the geometry data using the provided geometry projection
   * transform
   * @param transform geometry projection transform
   * @return transformed geometry data
   */
  public transform(transform: GeometryTransform | ProjectionTransform): GeoPackageGeometryData {
    const geometryTransform: GeometryTransform =
      transform instanceof GeometryTransform ? transform : GeometryTransform.create(transform);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let transformed: GeoPackageGeometryData = this;
    if (geometryTransform.getToProjection().equalsProjection(geometryTransform.getFromProjection())) {
      transformed = new GeoPackageGeometryData(transformed);
    } else {
      let geometry: Geometry = this.getGeometry();
      if (geometry != null) {
        geometry = geometryTransform.transformGeometry(geometry);
      }
      let envelope: GeometryEnvelope = this.getEnvelope();
      if (envelope != null) {
        envelope = geometryTransform.transformEnvelope(envelope);
      }
      transformed = new GeoPackageGeometryData(this.getSrsId(), geometry, envelope);
    }
    return transformed;
  }

  /**
   * Write the geometry data GeoPackage geometry buffer
   *
   * @param geometryData geometry data
   * @return geometry data
   */
  private static writeBuffer(geometryData: GeoPackageGeometryData): GeoPackageGeometryData {
    geometryData.toBuffer();
    return geometryData;
  }
}
