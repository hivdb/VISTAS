import style from './style.module.scss';
import PropTypes from 'prop-types';

TableView.propTypes = {
  table: PropTypes.array.isRequired,
  excludeColumns: PropTypes.array
};

export default function TableView({table, excludeColumns = []}) {
  if (table.length === 0) {
    return <></>;
  }

  // table = table.map((r) => {
  //   r.Organism = (r.Organism in virusToShortName) ? virusToShortName[r.Organism] : r.Organism;

  //   if (r['Isolation Source'] === 'Peripheral blood mononuclear cells') {
  //     r['Isolation Source'] = 'PBMC';
  //   }
  //   return r;
  // });

  let columns = Object.keys(table[0]);
  columns = columns.filter((c) => !excludeColumns.includes(c));

  return <table
    className={style['table-view']}
    style={{'--column-count': columns.length}}>
    <thead>
      <tr>
        {
          columns.map((c) => {
            return <th key={c} data-column={c}>
              {c.split(' ').map((word, index) => (
                <span key={`${c}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {word}
                </span>
              ))}
            </th>;
          })
        }
      </tr>
    </thead>
    <tbody>
      {table.map((item, index) => (
        <tr key={index}>
          {columns.map((c) => {
            return <td key={c} data-column={c}>{item[c]}</td>;
          })}
        </tr>
      ))}
    </tbody>
  </table>;
}
