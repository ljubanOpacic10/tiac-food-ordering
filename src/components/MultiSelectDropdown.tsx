import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';

interface MultiSelectDropdownProps<T> {
  options: T[];
  label: string;
  value: T[];
  onChange: (selectedValues: T[]) => void;
  labelKey: keyof T;
  valueKey: keyof T;
  labelDescription?: keyof T;
  enabled: boolean;
}

const MultiSelectDropdown = <T,>({
  options,
  label,
  value,
  onChange,
  labelKey,
  valueKey,
  labelDescription,
  enabled,
}: MultiSelectDropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
  };

  const handleOptionSelect = (option: T) => {
    const valueKeyVal = option[valueKey];
    const isSelected = value.some((item) => item[valueKey] === valueKeyVal);

    let updatedOptions;
    if (isSelected) {
      updatedOptions = value.filter((item) => item[valueKey] !== valueKeyVal);
    } else {
      updatedOptions = [...value, option];
    }

    onChange(updatedOptions);
  };

  const filteredOptions = options.filter((option) =>
    String(option[labelKey]).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.selectContainer,
          enabled === false && styles.disabledContainer,
        ]}
        onPress={() => {
          if (!enabled) return;
          toggleDropdown();
        }}
        activeOpacity={!enabled ? 1 : 0.7}
      >
        <Text style={styles.selectedValues}>
          {value.length > 0
            ? value.map((item) => String(item[labelKey])).join(', ')
            : 'Select options'}
        </Text>
      </TouchableOpacity>

      {isOpen && enabled && (
        <View style={styles.dropdown}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={search}
            onChangeText={handleSearchChange}
            editable={enabled}
          />
          <FlatList
            data={filteredOptions}
            keyExtractor={(item, index) => String(item[valueKey]) + index}
            renderItem={({ item }) => {
              const isSelected = value.some(
                (selected) => selected[valueKey] === item[valueKey]
              );

              return (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleOptionSelect(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.selectedOption,
                    ]}
                  >
                    {String(item[labelKey])}
                    {labelDescription
                      ? ` (${String(item[labelDescription])})`
                      : ''}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
    </View>
  );
};

export default MultiSelectDropdown;

const styles = StyleSheet.create({
  container: {
    margin: 10,
    width: 328,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  selectContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff',
  },
  selectedValues: {
    fontSize: 14,
    color: '#555',
  },
  dropdown: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
    maxHeight: 200,
  },
  searchInput: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  option: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedOption: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  disabledContainer: {
    backgroundColor: '#eee',
    borderColor: '#ccc',
    opacity: 0.6,
  },
});
