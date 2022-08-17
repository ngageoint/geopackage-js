import { FeatureIndexResults } from "./featureIndexResults";
import { FeatureRow } from "../user/featureRow";

/**
 * Iterable Feature Index Results to iterate on feature rows from a combination
 * of multiple Feature Index Results
 */
public class MultipleFeatureIndexResults implements FeatureIndexResults {

	/**
	 * List of multiple Feature Index Results
	 */
	private readonly results: FeatureIndexResults[] = [];

	/**
	 * Total feature row result count
	 */
	private readonly _count: number;

	/**
	 * Constructor
	 * @param results multiple results
	 */
	public constructor(results: FeatureIndexResults[]) {
		this.results.push(...results);
		let totalCount = 0;
		for (const result of results) {
			totalCount += result.count();
		}
		this._count = totalCount;
	}

	/**
	 * {@inheritDoc}
	 */
	public count(): number {
		return this._count;
	}

	/**
	 * {@inheritDoc}
	 */
	[Symbol.iterator](): IterableIterator<FeatureRow> {
		return new Iterator<FeatureRow>() {

			int index = -1;
			private Iterator<FeatureRow> currentResults = null;

			/**
			 * {@inheritDoc}
			 */
			public boolean hasNext() {
				boolean hasNext = false;

				if (currentResults != null) {
					hasNext = currentResults.hasNext();
				}

				if (!hasNext) {

					while (!hasNext && ++index < results.size()) {

						// Get an iterator from the next feature index results
						currentResults = results.get(index).iterator();
						hasNext = currentResults.hasNext();

					}

				}

				return hasNext;
			}

			/**
			 * {@inheritDoc}
			 */
			public FeatureRow next() {
				FeatureRow row = null;
				if (currentResults != null) {
					row = currentResults.next();
				}
				return row;
			}
		};
	}

	/**
	 * {@inheritDoc}
	 */
	public ids(): IterableIterator<number> {
		return new Iterable<Long>() {

			/**
			 * {@inheritDoc}
			 */
			@Override
			public Iterator<Long> iterator() {
				return new Iterator<Long>() {

					int index = -1;
					private Iterator<Long> currentResults = null;

					/**
					 * {@inheritDoc}
					 */
					@Override
					public boolean hasNext() {
						boolean hasNext = false;

						if (currentResults != null) {
							hasNext = currentResults.hasNext();
						}

						if (!hasNext) {

							while (!hasNext && ++index < results.size()) {

								// Get an iterator from the next feature index
								// results
								currentResults = results.get(index).ids()
										.iterator();
								hasNext = currentResults.hasNext();

							}

						}

						return hasNext;
					}

					/**
					 * {@inheritDoc}
					 */
					@Override
					public Long next() {
						Long id = null;
						if (currentResults != null) {
							id = currentResults.next();
						}
						return id;
					}

				};
			}
		};
	}

}
