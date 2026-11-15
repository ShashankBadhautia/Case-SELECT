/** Query results as a table. `result` is { columns, rows (arrays), rowCount, truncated }. */
export function ResultTable({ result }) {
  const { columns, rows, rowCount, truncated } = result;

  if (rowCount === 0) {
    return <p className="results__empty">No rows returned.</p>;
  }

  return (
    <div className="results">
      <p className="results__count">
        {rowCount} row{rowCount === 1 ? "" : "s"}
        {truncated && ` (showing the first ${rows.length})`}
      </p>
      <div className="results__scroll">
        <table>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={`${column}-${index}`} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((value, index) => (
                  <td key={index} className={value === null ? "is-null" : undefined}>
                    {value === null ? "NULL" : String(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
