var ConstraintParser = require('../../../../lib/db/table/constraintParser').ConstraintParser
  , ConstraintType = require('../../../../lib/db/table/constraintType').ConstraintType
  , GeoPackageTableCreator = require('../../../../lib/db/geoPackageTableCreator').GeoPackageTableCreator
  , should = require('chai').should()
  , assert = require('assert');

function testConstraintHelper(constraint, name, type) {
  should.exist(constraint);
  let constraintSql = constraint.buildSql();
  ConstraintParser.isType(type, constraintSql).should.be.true;
  assert.strictEqual(type, constraint.getType());
  assert.strictEqual(type, ConstraintParser.getType(constraintSql));
  assert.strictEqual(name, constraint.getName());
  assert.strictEqual(name, ConstraintParser.getName(constraintSql));
}

function testConstraintWithType(constraint, name, type) {
  testConstraintHelper(constraint, name, type);
  let constraintSql = constraint.buildSql();
  testConstraintHelper(ConstraintParser.getTableOrColumnConstraint(constraintSql), name, type);
}

function testConstraint(sql, names) {
  let primaryKeyCount = 0;
  let uniqueCount = 0;
  let checkCount = 0;
  let foreignKeyCount = 0;
  let constraints = ConstraintParser.getConstraints(sql);
  for (let i = 0; i < constraints.numTableConstraints(); i++) {
    let constraint = constraints.getTableConstraint(i);
    let name = names[i];
    testConstraintWithType(constraint, name, constraint.getType());
    switch (constraint.getType()) {
      case ConstraintType.PRIMARY_KEY:
        primaryKeyCount++;
        break;
      case ConstraintType.UNIQUE:
        uniqueCount++;
        break;
      case ConstraintType.CHECK:
        checkCount++;
        break;
      case ConstraintType.FOREIGN_KEY:
        foreignKeyCount++;
        break;
      default:
        assert.fail("Unexpected table constraint type: " + constraint.getType());
    }
  }

  let nameIndex = constraints.numTableConstraints();

  constraints.getColumnsWithConstraints().forEach(columnName => {
    for (let i = 0; i < constraints.numColumnConstraints(columnName); i++) {
      let constraint = constraints.getColumnConstraint(columnName, i);
      let name = null;
      if (constraint.getName() !== null && constraint.getName() !== undefined) {
        name = names[nameIndex++];
      }
      testConstraintWithType(constraint, name, constraint.getType());
    }
  });
  return { constraints, primaryKeyCount, uniqueCount, checkCount, foreignKeyCount };
}

function testSQLScript(script, primaryKey, unique, check, foreignKey, names) {
  let count = 0;
  let primaryKeyCount = 0;
  let uniqueCount = 0;
  let checkCount = 0;
  let foreignKeyCount = 0;

  script.forEach(sql => {
    const constraintResult = testConstraint(sql, names);
    count += constraintResult.constraints.numTableConstraints();
    primaryKeyCount += constraintResult.primaryKeyCount;
    uniqueCount += constraintResult.uniqueCount;
    checkCount += constraintResult.checkCount;
    foreignKeyCount += constraintResult.foreignKeyCount;
  });
  assert.strictEqual(primaryKey + unique + check + foreignKey, count);
  assert.strictEqual(primaryKey, primaryKeyCount);
  assert.strictEqual(unique, uniqueCount);
  assert.strictEqual(check, checkCount);
  assert.strictEqual(foreignKey, foreignKeyCount);
}

describe('Constraint Tests', function() {
  it('test table constraints', function() {
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.spatial_reference_system, 0, 0, 0, 0, []);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.contents, 0, 0, 0, 1, ["fk_gc_r_srs_id"]);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.geometry_columns, 1, 1, 0, 2, ["pk_geom_cols", "uk_gc_table_name", "fk_gc_tn", "fk_gc_srs"]);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.tile_matrix_set, 0, 0, 0, 2, ["fk_gtms_table_name", "fk_gtms_srs"]);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.tile_matrix, 1, 0, 0, 1, ["pk_ttm", "fk_tmm_table_name"]);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.data_columns, 1, 1, 0, 0, ["pk_gdc", "gdc_tn"]);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.data_column_constraints, 0, 1, 0, 0, ["gdcc_ntv"]);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.metadata, 0, 0, 0, 0, ["m_pk"]);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.metadata_reference, 0, 0, 0, 2, ["crmr_mfi_fk", "crmr_mpi_fk"]);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.extensions, 0, 1, 0, 0, ["ge_tce"]);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.extended_relations, 0, 0, 0, 0, []);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.table_index, 0, 0, 0, 0, []);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.geometry_index, 1, 0, 0, 1, ["pk_ngi", "fk_ngi_nti_tn"]);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.feature_tile_link, 1, 0, 0, 0, ["pk_nftl"]);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.tile_scaling, 0, 0, 1, 1, ["fk_nts_gtms_tn", null]);
    testSQLScript(GeoPackageTableCreator.tableCreationScripts.contents_id, 0, 1, 0, 1, ["uk_nci_table_name", "fk_nci_gc_tn"]);
  });
});
