import {SearchQuery} from './search-query';

describe('SearchQuery', () => {

  it('should parse a query from a hash', () => {
    const q = new SearchQuery({userName: 'fred', searchText: 'johnson', tagIds: '12345'});
    expect(q.userName).toEqual('fred');
    expect(q.searchText).toEqual('johnson');
    expect(q.tagIds).toEqual([12345]);
  });

  it('should clone a query from another query', () => {
    const q1 = new SearchQuery({userName: 'fred', searchText: 'johnson', tagIds: '12345'});
    const q = new SearchQuery(q1);
    expect(q.userName).toEqual('fred');
    expect(q.searchText).toEqual('johnson');
    expect(q.tagIds).toEqual([12345]);
    expect(q.equals(q1)).toBeTruthy('q not equal to q1');
    expect(q1.equals(q)).toBeTruthy('q1 not equal to q');
  });

  it('should create equal queries when serialized to params and back', () => {
    const q1 = new SearchQuery({userName: 'fred', searchText: 'johnson', tagIds: '12345'});
    let params1 = q1.toQueryString();
    let params2 = q1.toQueryString();
    expect(params1).toEqual(params2);
    let hash1 = q1.toQueryParamHash();
    let hash2 = q1.toQueryParamHash();
    const qa = new SearchQuery(hash1);
    const qb = new SearchQuery(hash2);
    expect(qa.equals(qb)).toBeTruthy('toQueryParamsHash and back not equivalent');
    expect(q1).toEqual(qa);
    expect(q1.equals(qb)).toBeTruthy('toQueryParamsHash and back not equivalent to orig');
  });

});
