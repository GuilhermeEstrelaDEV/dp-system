import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/common/Primitives';
import { useAuth } from '@/features/auth/AuthContext';
import { navigationItems } from './navigation';

export function QuickNavigation() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const available = navigationItems.filter(
    (item) =>
      item.path && !item.comingSoon && (!item.capability || auth.hasCapability(item.capability)),
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    const destination =
      available.find((item) => item.label.toLocaleLowerCase('pt-BR') === normalized) ??
      available.find((item) => item.label.toLocaleLowerCase('pt-BR').includes(normalized));
    if (!destination?.path || !normalized) return;
    navigate(destination.path);
    setQuery('');
  };

  return (
    <form
      aria-label="Navegacao rapida por modulo"
      className="quick-navigation"
      onSubmit={submit}
      role="search"
    >
      <label className="sr-only" htmlFor="quick-navigation-input">
        Ir para modulo
      </label>
      <Input
        autoComplete="off"
        id="quick-navigation-input"
        list="quick-navigation-options"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ir para modulo..."
        value={query}
      />
      <datalist id="quick-navigation-options">
        {available.map((item) => (
          <option key={item.path} value={item.label} />
        ))}
      </datalist>
      <button className="sr-only" type="submit">
        Abrir modulo
      </button>
    </form>
  );
}
