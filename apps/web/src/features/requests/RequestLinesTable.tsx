import { pluralize, totalBottles, type SavedRequest } from './savedRequest';
import { StockAtSave } from './StockAtSave';

type RequestLinesTableProps = {
  request: SavedRequest;
};

export function RequestLinesTable({ request }: RequestLinesTableProps) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">
        Wines requested by {request.customer}
      </caption>
      <thead className="border-b border-border text-muted">
        <tr>
          <th scope="col" className="py-2 pr-4 text-right font-medium">
            Qty
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Wine
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Vintage
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Size
          </th>
          <th scope="col" className="py-2 font-medium">
            Stock at save
          </th>
        </tr>
      </thead>
      <tbody>
        {request.lines.map((line) => (
          <tr key={line.id} className="border-b border-border align-top">
            <td className="py-2 pr-4 text-right font-medium">
              {line.requested}
            </td>
            <td className="py-2 pr-4">
              <div>
                {line.producer} {line.wine}
              </div>
              <div className="text-muted">{line.region}</div>
            </td>
            <td className="py-2 pr-4">{line.vintage ?? 'NV'}</td>
            <td className="py-2 pr-4">
              <span className="rounded-full border border-border px-2 py-0.5 text-xs">
                {line.size}
              </span>
            </td>
            <td className="py-2">
              <StockAtSave line={line} />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td className="py-2 pr-4 text-right font-semibold">
            {totalBottles(request)}
          </td>
          <td colSpan={4} className="py-2 text-muted">
            bottles in {pluralize(request.lines.length, 'wine', 'wines')}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
