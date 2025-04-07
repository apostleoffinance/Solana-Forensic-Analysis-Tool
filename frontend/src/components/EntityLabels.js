export default function EntityLabels({ entities }) {
    return (
      <div>
        <h2>Entity Labels</h2>
        <ul>
          {Object.entries(entities).map(([wallet, label]) => (
            <li key={wallet}>
              {wallet}: {label}
            </li>
          ))}
        </ul>
      </div>
    );
  }