// @flow

import * as React from 'react'
import classnames from 'classnames'

import { removeElementByCreatingNewArray } from '../../utils'

import './index.scss'

type Id = number | string

export type Column = {
  name: string,
  propertyId: string,
  className: string,
  render?: (any) => React.Node,
  id: Id
}

export type SortOrder = {
  propertyId: string,
  descending: boolean
}

export type RowId = Id

export type DataAndColumnsProps = {
  data: Array<any>,
  columns: Array<Column>,
  fetching?: boolean,
  fetchData?: (?SortOrder) => Promise<any>
}

export type SelectableProps = {
  notSelectableRows?: Array<RowId>,
  onSelectedRowsChange?: Array<RowId> => void,
}

type Props = DataAndColumnsProps
  & SelectableProps
  & {
    containerClassName: string,
    tableBodyHeight?: string,
    noDataText?: string,
    sortable?: boolean,
    selectable?: boolean
  }

type State = {
  sortOrder: ?SortOrder,
  selectedRows: Array<RowId>
}

const NO_DATA_TEXT = 'No data matches your query'

export default class Table extends React.Component<Props, State> {
  handleSortChange: (string, boolean) => void
  handleSelectRowChange: (id: RowId, checked: boolean) => void
  handleSelectAllChange: (SyntheticInputEvent<HTMLInputElement>) => void

  constructor(props: Props) {
    super(props)

    this.state = {
      sortOrder: null,
      selectedRows: []
    }

    this.handleSelectRowChange = this.handleSelectRowChange.bind(this)
    this.handleSelectAllChange = this.handleSelectAllChange.bind(this)
  }

  componentWillReceiveProps(nextProps: Props) {
    // If new data is received reset state.
    if (this.props.data !== nextProps.data) {
      this.setState({
        selectedRows: []
      })

      const { onSelectedRowsChange } = this.props

      return onSelectedRowsChange && onSelectedRowsChange([])
    }
  }

  handleSortChange(propertyId: string, resetSortOrder: boolean) {
    const nextSortOrder = this.getNextSortOrder(propertyId, resetSortOrder)

    this.setState({ sortOrder: nextSortOrder })

    const { fetchData } = this.props

    return fetchData && fetchData(nextSortOrder)
  }

  handleSelectRowChange(id: RowId, checked: boolean) {
    const { selectedRows } = this.state

    const updatedSelectedRows = (
      checked ? [...selectedRows, id] : removeElementByCreatingNewArray(selectedRows, x => x === id)
    )

    this.updatedSelectedRows(updatedSelectedRows)
  }

  handleSelectAllChange(event: SyntheticInputEvent<HTMLInputElement>) {
    const {
      checked
    } = event.target

    const notSelectableRows = this.props.notSelectableRows || []

    const updatedSelectedRows = (
      !checked ?
        [] :
        this.props.data.filter(x => !notSelectableRows.find(rowId => rowId === x.id))
          .map(x => x.id)
    )

    this.updatedSelectedRows(updatedSelectedRows)
  }

  getNextSortOrder(propertyId: string, resetSortOrder: boolean) {
    const {
      sortOrder
    } = this.state

    if (resetSortOrder) return null

    if (sortOrder && (sortOrder.propertyId === propertyId)) {
      return { propertyId, descending: !sortOrder.descending }
    }

    return { propertyId, descending: false }
  }

  updatedSelectedRows(updatedSelectedRows: Array<RowId>) {
    this.setState({ selectedRows: updatedSelectedRows })

    const { onSelectedRowsChange } = this.props

    return onSelectedRowsChange && onSelectedRowsChange([...updatedSelectedRows])
  }

  renderHeaderColumn(column: Column) {
    const {
      sortable
    } = this.props

    const {
      className,
      propertyId,
      name,
      id
    } = column

    if (!sortable) {
      return (
        <th
          key={id}
          className={className}
        >
          {name}
        </th>
      )
    }

    const {
      sortOrder
    } = this.state

    const extendedClassName =
      (sortOrder && (sortOrder.propertyId === column.propertyId)) ?
        classnames(
          className,
          {
            'table-component__sort-asc': !sortOrder.descending,
            'table-component__sort-desc': sortOrder.descending
          }
        ) :
        className

    return (
      <th
        key={id}
        onClick={e => this.handleSortChange(propertyId, e.shiftKey)}
        className={extendedClassName}
      >
        {name}
      </th>
    )
  }

  renderHeader() {
    const {
      columns,
      selectable,
      data,
      notSelectableRows
    } = this.props

    if (!selectable) {
      return (
        <thead>
          <tr>
            {
              columns.map(column => this.renderHeaderColumn(column))
            }
          </tr>
        </thead>
      )
    }

    const { selectedRows } = this.state

    const canSelectAll = notSelectableRows && data.length !== notSelectableRows.length
    const allRowsSelected = (
      selectedRows.length &&
      notSelectableRows &&
      (selectedRows.length === (data.length - notSelectableRows.length))
    )

    return (
      <thead>
        <tr>
          {
            selectable ? (
              <th>
                <input
                  type="checkbox"
                  disabled={!canSelectAll}
                  checked={allRowsSelected}
                  onChange={this.handleSelectAllChange}
                />
              </th>
            ) : null
          }
          {
            columns.map(column => this.renderHeaderColumn(column))
          }
        </tr>
      </thead>
    )
  }

  renderData() {
    const {
      columns,
      data,
      fetching,
      noDataText,
      selectable,
      notSelectableRows
    } = this.props

    const { selectedRows } = this.state

    return (
      <tbody>
        {
          !fetching && !data.length ? (
            <tr className="empty-table">
              <td>{noDataText || NO_DATA_TEXT}</td>
            </tr>
          ) : (
            data.map(record => (
              <tr key={record.id}>
                {
                  selectable && selectedRows ? (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.find(rowId => rowId === record.id)}
                        disabled={notSelectableRows && notSelectableRows.find(rowId => rowId === record.id)}
                        onChange={event => this.handleSelectRowChange(record.id, event.target.checked)}
                      />
                    </td>
                  ) : null
                }
                {
                  columns.map(column => (
                    <td
                      key={`${record.id},${column.id}`}
                      className={column.className}
                    >
                      {
                        column.render ? (
                          column.render(record)
                        ) : record[column.propertyId]
                      }
                    </td>
                  ))
                }
              </tr>
            ))
          )
        }
      </tbody>
    )
  }

  renderTable() {
    const {
      tableBodyHeight
    } = this.props

    const style = tableBodyHeight ? { height: tableBodyHeight } : null

    return (
      <table
        style={style}
        className="table-component"
      >
        {
          this.renderHeader()
        }
        {
          this.renderData()
        }
      </table>
    )
  }

  render() {
    const {
      containerClassName
    } = this.props

    return (
      <div className={containerClassName}>
        {
          this.renderTable()
        }
      </div>
    )
  }
}

